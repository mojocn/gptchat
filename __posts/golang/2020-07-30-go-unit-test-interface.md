---
layout: post
title: "Go进阶48:单元测试和Interface(译)"
category: Golang
tags: Go进阶 
keywords: "单元测试,golang,Go语言,interface,接口"
description: "编写单元测试代码使代码更简洁,更精确,单元测试,interface,接口"
coverage: golang_unit_test_interface.png
permalink: /go/:title
date: 2020-07-30T16:06:00+08:00
---

[原文地址:Tests Make Your Code Inherently Better](https://www.mitchdennett.com/tests-make-your-code-inherently-better/)

**编写单元测试代码使代码更简洁,更精确.**
`testing` 为 Go 语言 package 提供自动化测试的支持.通过 go test 命令,能够自动执行如下形式的任何函数.在这个简短的示例代码中,我们将看一个REST API,该API返回食谱列表.

## 1. The "Bad" Code.

让我们看一下一些用引号引起来的Bad Code.

```go
func (h *Handler) handleListRecipes(w http.ResponseWriter, r *http.Request) {
	pages, ok := r.URL.Query()["page"]

	if !ok || len(pages[0]) < 1 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	page, err := strconv.Atoi(pages[0])

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	queryDocStmt := `SELECT recipe_id, title from recipe limit 50 offset $1`

	var offset int
	if page-1 < 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	offset = (page - 1) * 50

	rows, err := h.DB.Query(queryDocStmt, offset)
	itemsList := make([]*better.Recipe, 0)

	if err != nil {
		log.Println(err)
	}
	defer rows.Close()
	for rows.Next() {
		var item better.Recipe

		if err := rows.Scan(&item.ID, &item.Title); err != nil {
			// Check for a scan error.
			// Query rows will be closed with defer.
			log.Println(err)
			continue
		}

		itemsList = append(itemsList, &item)

	}

	retJSON, err := json.Marshal(itemsList)
	fmt.Fprintf(w, string(retJSON))
}
```

这段代码是一团糟.根本无法测试.在进行单元测试时,我们实际上并不希望调用database.我们可以假设标准库已经过详尽的单元测试.
回到我们的代码.没有简单的方法可以模拟数据库调用,帮助我们来编写一个好的单元测试.

## 2.重构我们的数据库调用函数

因此,我们需要使数据库调用可模拟.
这只是意味着我们需要一种在单元测试过程中用其他方式替换实际的数据库调用的方法,
因此我们实际上并没有向数据库发出查询请求.因此,我们把数据库查询代码抽出来,创建一个`Store`负责与数据库进行所有交互.

```go
type Store struct {
	DB *sql.DB
}

//ListRecipes will list all the recipes for a given page
func (d *DB) ListRecipes(page int) ([]*better.Recipe, error) {
	queryDocStmt := `SELECT recipe_id, title from recipe limit 50 offset $1`

	var offset int
	if page-1 < 0 {
		return nil, errors.New("Bad Request")
	}

	offset = (page - 1) * 50

	rows, err := d.DB.Query(queryDocStmt, offset)
	itemsList := make([]*better.Recipe, 0)

	if err != nil || rows == nil {
		log.Println(err)
		return nil, err
	}

	defer rows.Close()
	for rows.Next() {
		var item Recipe

		if err := rows.Scan(&item.ID, &item.Title); err != nil {
			// Check for a scan error.
			// Query rows will be closed with defer.
			log.Println(err)
			continue
		}

		itemsList = append(itemsList, &item)

	}

	return itemsList, nil

}
```

这是朝正确方向迈出的一步.有了这个,我们就可以编辑`handleListRecipes` 函数.

```go
func (h *Handler) handleListRecipes(w http.ResponseWriter, r *http.Request) {
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil {
		http.Error(w, "invalid page", http.StatusBadRequest)
		return
	}

	items, err := h.RecipeStore.ListRecipes(page)
	if err != nil {
		log.Print("http error", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(items); err != nil {
		log.Print("http json encoding error", err)
	}
}
```

如您所见,这使我们的handler函数更加简洁,可读性和精确性.
我们还没完成.为了能够mock（replace）我们RecipeStore的测试,我们需要创建一个interface.
如果您唯一要摆脱的就是更多地使用`Interfaces`,我将认为这是成功的.

## 3. Interfaces, Interfaces, Interfaces

让我们创建我们的interface,以便`RecipeStore`在测试时可以模拟我们的interface.

```go
type RecipeService interface {
	ListRecipes(page int) ([]*Recipe, error)
}
```

超级简单.但是超级强大.

这样,只需更改我们的`Handler`以采用`RecipeService` `interface`即可,而不是确切的 `RecipeStore`.
瞧,我们现在可以开始编写测试了.

```go
items, err := h.RecipeService.ListRecipes(page)
```

## 4. 单元测试

现在我们已经重构了代码,可以开始单元测试了.现在,用我们现在可以非常容易地在测试用 `mock service` 来替换实际的`Store`.
这里没有其他的数据库调用了.

首先,让我们创建一个新的 `mock package` 来保存我们所有的模拟,`recipe_service.go`使用以下代码创建一个文件.

```go
ackage mock

import (
	better "github.com/mitchdennett/tests-make-your-code-inherently-better"
)

type MockRecipeService struct {
	ListRecipesFunc func(page int) ([]*better.Recipe, error)
}

func (s *MockRecipeService) ListRecipes(page int) ([]*better.Recipe, error) {
	return s.ListRecipesFunc(page)
}
```

`MockRecipeService` 允许我们的单元测试向其中注入一个function以测试不同的结果.现在我们可以编写我们的第一个测试.

```go
func TestListRecipes(t *testing.T) {
	req, err := http.NewRequest("GET", "/recipes?page=1", nil)
	if err != nil {
		t.Fatal(err)
	}

	var store mock.MockRecipeService
	store.ListRecipesFunc = func(page int) ([]*better.Recipe, error) {
		return []*better.Recipe\{\{ID: 1, Title: "Pasta"\}\}, nil
	}
	handler := Handler{RecipeService: &store}

	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
}
```

## 5. 为什么这样更好？

代码更好有多个原因.

- 显而易见的是,我们现在可以正确地测试我们的代码.
- 其次,我们的代码更加简洁,清晰和可读.
- 最后,我们从一个包中移除了对数据库的依赖.
- 如果我们需要更改数据存储,则只需实现`RecipeService接口`就可以了.

现在肯定可以做更多的事情来改进此代码.
仅通过专注于测试,我们必然要编写更好,更简洁的代码.

- [最终代码](https://github.com/mitchdennett/tests-make-your-code-inherently-better)
- [原文地址:Tests Make Your Code Inherently Better](https://www.mitchdennett.com/tests-make-your-code-inherently-better/)
- [Go进阶06:怎么使用Gomock进行单元测试](/2018/12/26/golang-gomock-unit-test)
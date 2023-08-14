---
layout: post
title: "Go进阶33:扁平项目代码结构"
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,代码结构,扁平项目代码结构
description: "一个项目把全部代码文件都放在一个package中,这就是扁平项目代码结构,这个代码组织方式的好处和优缺点分析"
coverage: golang_app_structure.png
permalink: /go/:title
date: 2019-10-18T14:59:45+08:00
---

## 1. 扁平项目代码结构(Flat Application Structure)

一个项目把全部代码文件都放在一个package中,这就是扁平项目代码结构(Flat Application Structure).
代码结构如下是:

```bash
myapp/
  main.go
  server.go
  user.go
  lesson.go
  course.go
```

每个人初学编程的时候都是实现扁平项目代码结构(Flat Application Structure). 官方 [Go tour](https://tour.go-zh.org/welcome/1) 和
网上很多golang教程/Demo都采用项目代码扁平结构. 采用这个结构的项目代码不用在跳转进入下层Package, 他们只是创建多个 `.go` 文件放在相同的Package(`main`)下面.

出看起这样组织项目代码文件是非常糟糕的.

1. 代码会不会很快变得笨拙?
2. 如何将业务逻辑与UI渲染代码分开?
3. 如何找到正确的源文件?
   毕竟,我们使用Package的很大一部分原因是解决怎么更容易快速地导航到正确的源文件的问题.

## 2. 高效的使用项目代码扁平结构

使用平面项目代码结构时,您仍应该遵循编码最佳实践.您需要使用不同的.go文件来分隔应用程序的不同功能：

```bash
myapp/
  main.go # 读取配置信息和启动app
  server.go # 启动http-server 和路由
  user_handler.go # user API 业务逻辑
  user_store.go # user DB 数据逻辑
  # ...
```

### 2.1 项目代码扁平结构:解决全局变量问题

全局变量可能是给问题,您可以通过 `type` 和 `method`来解决这一问题.

```go
type Server struct {
  apiClient *someapi.Client
  router *some.Router
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
  s.router.ServeHTTP(w, r)
}
```

### 2.2 项目代码扁平结构:func main 逻辑分离

在 `func main()` 您可能需要从项目启动分离大部分的logic

```go
// Warning: 以下代码有可能不能编译.

type Config struct {
  SomeAPIKey     string
  Port           string
  EnableTheThing bool
}

func main() {
  var config Config
  config.SomeAPIKey = os.Getenv("SOMEAPI_KEY")
  config.Port = os.Getenv("MYAPP_PORT")
  if config.Port == "" {
    config.Port = "3000"
  }
  config.EnableTheThing = true

  if err := run(config); err != nil {
    log.Fatal(err)
  }
}

func run(config Config) error {
  server := myapp.Server{
    APIClient: someapi.NewClient(config.SomeAPIKey),
  }
  return http.ListenAndServe(":" + config.Port, server)
}
```

### 2.3 项目代码扁平结构:command模式

实际上您也可以使用扁平项目代码结构,分离出一个cmd目录,在这个目录中定义您的`main package` 和 `func main`. 这种设计模式可以让您使用`cmd`下级目录设计模式.

```bash
myapp/
  cmd/
    web/
      # package main
      main.go
    cli/
      # package main
      main.go
  # package myapp
  server.go
  user_handler.go
  user_store.go
  ...
```

在上面的例子中项目代码结构也可以说是扁平的. 您把 main package 抽离出来满足两个command 命令.

## 3. 为什么要使用项目代码扁平结构?

项目代码扁平结构的主要好处不是将所有代码都保存在一个目录中.
***这种结构的核心好处是您可以不必担心如何组织项目代码,而专注于通过应用程序解决的问题.***

我并建议在大型项目中使用项目代码扁平结构,大型企业组织需要使用更复杂的代码结构.
我们不应该过多的考虑把代码放在什么地方,而应该多考虑如何编写代码并解决我的特定问题.
项目代码扁平结构可以使您更轻松地专注于代码学习和代码构建.

我们不再担心诸如“该逻辑代码应该放在哪里?”之类的问题,因为在项目代码扁平结构中bug很容易被定为和被解决.
如果它是一个函数,我们可以将其移动到包中的任何代码文件中.
如果它是错误类型的方法,我们可以创建两个新类型并将逻辑与原始类型分开.
有了这些,我们不必担心会遇到奇怪的循环import问题,因为我们只有一个软件包.

使用项目代码扁平结构的另一个重要原因是,随着应用程序复杂性的增加,项目代码结构重新组织将会更容易.
将代码refactor到一个单独的程序包中时,您通常需要做的就是将一些源文件移到一个子目录中,更改其package 名称,并更新任何import以使用新的package前缀.

项目代码扁平结构对于Golang新手非常友好,可以避免`user.User`这样的代码和循环import.

通过推迟创建新package,直到我们的应用程序代码成长并更好地理解项目代码,新手Gophers犯这样的错误的可能性大大降低.

***这也是为什么许多人会鼓励开发人员避免过早将其代码分解到微服务中的原因***
您通常没有足够的知识和经验来,来决定将哪些内容拆分为微服务.

## 4. 项目代码扁平结构不是万能的

项目代码扁平结构没有任何缺点,这对我来说是不诚实的,所以我们也应该谈论这些.

### 4.1 缺点:重构

***对于初学者来说,项目代码扁平结构只能带您深入***.
它会工作一段时间（可能比您想象的更长）,但是到某个时候,您的应用程序将变得足够复杂,您需要开始对其进行分解.
使用平面结构的好处是您可以推迟refactor(分解)它,并且在refactor分解时可能会更好地理解您的代码.
不利之处在于,您将需要花一些时间进行重构,并且您可能发现自己将重构成自己之前设想的那样.

### 4.2 缺点:命名冲突

使用平面结构时,命名冲突有时也会很尴尬.
例如,假设您想要Course在应用程序中import类型,但是在数据库中表示Course的method与在JSON中呈现Course的method不同.

### 4.3 缺点:重构循环导入

将代码重构到新程序包中也不总是那么简单.是的,这通常很容易,但是由于您的所有代码都在一个包中,
因此您有时可能会遇到天生具有循环import的代码.
例如,假设我们的课程是否具有始终以crs_JSON响应开头的ID ,
并且我们想获取各种货币返回价格.我们可以创建一个JsonCourse来处理：

```go
type JsonCourse struct {
  ID       string `json:"id"`
  Price struct {
    USD string `json:"usd"`
  } `json:"price"`
}
```

同时,SqlCourse仅需要存储一个整数ID和一个以美元分为单位的单一价格,我们就可以使用各种货币对其进行格式化.

```go
type SqlCourse struct {
  ID    int
  Price int
}
```

现在我们需要一种从转换为的SqlCourse方法JsonCourse,因此我们可以将其作为SqlCourse类型的方法：

```go
func (sc SqlCourse) ToJson() (JsonCourse, error) {
  jsonCourse := JsonCourse{
    ID: fmt.Sprintf("crs_%v", sc.ID),
  }
  jsonCourse.Price.USD = Price: fmt.Sprintf("%d.%2d", sc.Price/100, sc.Price%100)
  return jsonCourse, nil
}
```

然后,稍后我们可能需要一种方法来解析传入的JSON并将其转换为等效的SQL,因此我们将其JsonCourse作为另一种方法添加到类型中：

```go
func (jc JsonCourse) ToSql() (SqlCourse, error) {
  var sqlCourse SqlCourse
  // JSON ID is "crs_123" and we convert to "123"
  // for SQL IDs
  id, err := strconv.Atoi(strings.TrimPrefix(jc.ID, "crs_"))
  if err != nil {
    // Note: %w is a Go 1.13 thing that I haven't really
    // tested out, so let me know if I'm using it wrong 😂
    return SqlCourse{}, fmt.Errorf("converting json course to sql: %w", err)
  }
  sqlCourse.ID = id
  // JSON price is 1.00 and we may convert to 100 cents
  sqlCourse.Price = ...
  return sqlCourse, nil
}
```

我们在这里采取的每一个步骤都有意义并且很有逻辑性,但是现在我们剩下两种类型,它们必须位于同一程序包中,否则它们将会出现循环导入.

我们真正需要做的就是提取转换逻辑并将其放置在我们同时使用两种类型的位置.

```go
func JsonCourseToSql(jsonCourse json.Course) (sql.Course, error) {
  // move the `ToSql()` functionality here
}

func SqlCourseToJson(sqlCourse sql.Course) (json.Course, error) {
  // Move the `ToJson()` functionality here
}
```

### 4.4 缺点:项目代码扁平结构不时髦

最后,***项目代码扁平结构不时髦***;如果您想在咖啡店里向您的好友展示自己的能力,这可能不会为您带来加分.
另一方面,如果您只是想让代码正常运行,那么这很合适.

## 5. 项目代码扁平结构适合我吗?

***不要想一步就可以构建一个完美的项目,不要逃避每一次重构您项目代码的需求.***
几乎不能预测您的app的未来需求,项目代码扁平结构仅仅是我们作为开发人员尝试实现的一种方式.

大型企业组织需要使用更复杂的代码结构.原因有一下几点:

1. 需要使用各种配置进行测试
2. 需要坚如磐石的单元测试
3. 复杂的业务需求
4. CI/CD

如果您是一个学习编程的独立开发人员,或者是一个试图快速迁移的小型团队,则您的需求是不同的.
在不了解他们为什么选择他们选择的项目代码结构的情况下,假装自己是一个大型组织,这很可能会使您的工作减速同时也帮不到您.

您应该选择最适合您当前情况的项目代码结构结构.有以下几点原则

1. 如果您不确定应用程序将要变得多么复杂或正在学习代码中,那么项目代码扁平结构是一个很好的起点.
2. 一旦对应用程序需求有了更好的了解,便可以重构和/或提取软件包.
3. 活动开发者都不愿重构,如果不refactor重构应用程序,通常很难理解应如何拆分.
4. 当人们跳到微服务的速度太快时,也会出现此问题.

另一方面,如果您已经知道您的应用程序将是庞大的复杂的,
也许您正在将一个大型应用程序从一个堆栈移植到另一个堆栈,
那么这可能项目代码扁平结构是一个不好的起点,

## 6. 其他注意事项

如果您选择尝试采用项目代码扁平结构,则需要牢记一下事项：

1. 不要应为只有一个package,而不适用编程最佳实践.
2. 避免全局变量,配置应该在`man` `run`进行. 配置在`init`中是有害的.
3. 不要被扁平结构限制死.一旦代码功能清晰就refactor功能代码到一个新的package.
4. 您仍然可以从将代码分解为单独的源文件并使用自定义type中受益

实际上,作为一个初级开发人员,我认为使您的***代码正常工作和理解它比完善结构更重要***,因为您将通过编码学习更多的知识,
而不是为做错事情而烦恼.
编写初始的工作版本通常比使用Go最佳实践对其进行重构要困难得多.
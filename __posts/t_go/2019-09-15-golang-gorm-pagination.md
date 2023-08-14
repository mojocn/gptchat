---
layout: post
title: Go教程:22 RESTful-Gorm-Gin分页搜索最佳实践
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,接口分页和搜索
description:  Go语言教程,Golang教程,API分页,字段搜索
permalink: /go/:title
coverage: pagination_search.png
date: 2019-09-15T12:00:54+08:00
---

API处理分页看似简单,实际上暗藏危机.最常见的分页方式,大概是下面这样的

- 页数表示法：`/user/?page=1&size=15&name=李`
- 偏移量表示法：`/user/?offset=100&limit=15&name=李`

使用页码表示法对前端开发比较友好,但是本质上是和偏移量表示发相似.
在这里我们将使用 [jinzhu/gorm](https://github.com/jinzhu/gorm)和 [gin-gonic/gin](https://github.com/gin-gonic/gin) 开发一个简单的分页接口

分页查询URL: `http://dev.mojotv.cn:3333/api/ssh-log?client_ip=&page=1&size=10&user_id=0&machine_id=0`
返回json 结果

```json
{
    "data": [
        {
            "id": 28,
            "created_at": "2019-09-12T14:25:54+08:00",
            "updated_at": "2019-09-12T14:25:54+08:00",
            "user_id": 26,
            "machine_id": 1,
            "ssh_user": "mojotv.cn",
            "client_ip": "10.18.60.16",
            "started_at": "2019-09-12T14:24:05+08:00",
            "status": 0,
            "remark": ""
        }
    ],
    "ok": true,
    "page": 1,
    "size": 10,
    "total": 1
}
```

项目完整地址[libragen/felix](https://github.com/libragen/felix)

## 1. 定义分页struct

```go
//PaginationQ gin handler query binding struct
type PaginationQ struct {
	Ok    bool        `json:"ok"`
	Size  uint        `form:"size" json:"size"`
	Page  uint        `form:"page" json:"page"`
	Data  interface{} `json:"data" comment:"muster be a pointer of slice gorm.Model"` // save pagination list
	Total uint        `json:"total"`
}
```

- `Ok` 代表业务查询没有出错
- `Size` 每页显示的数量,使用 `form` tag 接受gin的url-query参数
- `Page` 当前页码,使用 `form` tag 接受gin的url-query参数
- `Data` 分页的数据内容
- `Total` 全部的页码数量

## 2. 数据表Model

这里以ssh_log(ssh 命令日志为示例),使用GORM创建MYSQL数据表模型,
使用 `form` tag 接受gin的url-query参数,作为搜索条件

 ```go
type SshLog struct {
	BaseModel
	UserId    uint      `gorm:"index" json:"user_id" form:"user_id"` //form tag 绑定gin url-query 参数
	MachineId uint      `gorm:"index" json:"machine_id" form:"machine_id"` //form tag 绑定gin url-query 参数
	SshUser   string    `json:"ssh_user" comment:"ssh账号"`
	ClientIp  string    `json:"client_ip" form:"client_ip"` //form tag 绑定gin url-query 参数
	StartedAt time.Time `json:"started_at" form:"started_at"`
	Status    uint      `json:"status" comment:"0-未标记 2-正常 4-警告 8-危险 16-致命"`
	Remark    string    `json:"remark"`
	Log       string    `gorm:"type:text" json:"log"`
	Machine   Machine   `gorm:"association_autoupdate:false;association_autocreate:false" json:"machine"`
	User      User      `gorm:"association_autoupdate:false;association_autocreate:false" json:"user"`
}
```

## 3. 定义分页查询搜索的结构体

```go
type SshLogQ struct {
	SshLog
	PaginationQ
	FromTime string `form:"from_time"` //搜索开始时间
	ToTime   string `form:"to_time"`  //搜索结束时候
}
```

这个结构体是提供给gin handler用作参数绑定的.
使用的方法如下:
[ssh2ws/internal/h_ssh_log.go](https://github.com/libragen/felix/blob/master/ssh2ws/internal/h_ssh_log.go)

```go
func SshLogAll(c *gin.Context) {
	query := &model.SshLogQ{}
	err := c.ShouldBindQuery(query) //开始绑定url-query 参数到结构体
	if handleError(c, err) {
		return
	}
	list, total, err := query.Search()  //开始mysql 业务搜索查询
	if handleError(c, err) {
		return
	}
	//返回数据开始拼装分页json
	jsonPagination(c, list, total, &query.PaginationQ)
}
```

## 4. 分页和搜索数据查询

- 1.创建 db-query
- 2.搜索非空业务字段
- 3.使用crudAll 方法获取数据

[model/m_ssh_log.go](https://github.com/libragen/felix/blob/master/model/m_ssh_log.go)

```go
type SshLogQ struct {
	SshLog
	PaginationQ
	FromTime string `form:"from_time"`
	ToTime   string `form:"to_time"`
}

func (m SshLogQ) Search() (list *[]SshLog, total uint, err error) {
	list = &[]SshLog{}
	//创建 db-query
	tx := db.Model(m.SshLog).Preload("User").Preload("Machine")
	//搜索非空业务字段
	if m.ClientIp != "" {
		tx = tx.Where("client_ip like ?", "%"+m.ClientIp+"%")
	}
	//搜索时间段
	if m.FromTime != "" && m.ToTime != "" {
		tx = tx.Where("`created_at` BETWEEN ? AND ?", m.FromTime, m.ToTime)
	}
	//使用crudAll 方法获取数据
	total, err = crudAll(&m.PaginationQ, tx, list)
	return
}
```

crudAll 方法来构建sql分页数据,

1. 设置默认参数
2. 获取全部搜索数量
3. 获取偏移量的数据
4. 拼装json 分页数据
   [model/helper.go](https://github.com/libragen/felix/blob/master/model/helper.go)

```go
func crudAll(p *PaginationQ, queryTx *gorm.DB, list interface{}) (uint, error) {
	//设置默认参数
	if p.Size < 1 {
		p.Size = 10
	}
	if p.Page < 1 {
		p.Page = 1
	}

    //获取全部搜索数量
	var total uint
	err := queryTx.Count(&total).Error
	if err != nil {
		return 0, err
	}
	offset := p.Size * (p.Page - 1)
	
	//获取偏移量的数据
	err = queryTx.Limit(p.Size).Offset(offset).Find(list).Error
	if err != nil {
		return 0, err
	}
	return total, err
}

//拼装json 分页数据
func jsonPagination(c *gin.Context, list interface{}, total uint, query *model.PaginationQ) {
	c.AbortWithStatusJSON(200, gin.H{"ok": true, "data": list, "total": total, "page": query.Page, "size": query.Size})
}
```


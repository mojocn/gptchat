---
layout: post
title: 细说Golang的JSON解析
category: Golang
tags: Golang
keywords: go语言
description: 细说Golang的JSON解析
coverage: ginbro_coverage.jpg
ref: https://segmentfault.com/a/1190000019787975
---

之前一直写一些动态语言,觉得解析JOSN还是很简单的,往往只需要几行代码就能拿到解析好的JSON对象.Go语言自带的json包可以让您在程序中方便的读取和写入 JSON
数据.生成JSON场景相对简单一些,`json.Marshal()`会根据传入的结构体生成JSON数据.解析JSON会把数据解析到结构体中,由于JSON格式的自由组合的特点,尤其是那些结构复杂的JSON数据对新手来说声明接受JSON数据的结构体类型就会陷入不知从何下手的困扰.
最近工作中由于要解析JS和PHP程序持久化的JSON数据,大概花了两个下午才搞清楚针对常见的JSON数据应该如何声明结构体类型,下面分别说明一下.

### 解析简单JSON

```go
package main

import (
    "fmt"
    "encoding/json"
    "time"
    
)

func main() {
    type FruitBasket struct {
        Name    string 
        Fruit   []string
        Id      int64 `json:"ref"`// 声明对应的json key
        Created time.Time
    }

    jsonData := []byte(`
    {
        "Name": "Standard",
        "Fruit": [
             "Apple",
            "Banana",
            "Orange"
        ],
        "ref": 999,
        "Created": "2018-04-09T23:00:00Z"
    }`)

    var basket FruitBasket
    err := json.Unmarshal(jsonData, &basket)
    if err != nil {
         fmt.Println(err)
    }
    fmt.Println(basket.Name, basket.Fruit, basket.Id)
    fmt.Println(basket.Created)
}
```

说明： 由于`json.UnMarshal()`方法接收的是字节切片,所以首先需要把JSON字符串转换成字节切片`c := []byte(s)`

Playground url: [https://play.golang.org/p/mcB...](https://play.golang.org/p/mcB6Kb6zCHE)

### 解析内嵌对象的JSON

把上面的Fruit值如果改成字典 `"Fruit" : {"Name", "Apple", "PriceTag": "$1"}`, 变成：

```go
    jsonData := []byte(`
    {
        "Name": "Standard",
        "Fruit" : {"Name": "Apple", "PriceTag": "$1"},
        "ref": 999,
        "Created": "2018-04-09T23:00:00Z"
    }`)
```

那么结构体类型应该这么声明

```go
type Fruit struct {
    Name string `json":Name"`
    PriceTag string `json:"PriceTag"`
}

type FruitBasket struct {
    Name    string 
    Fruit   Fruit
    Id      int64 `json:"ref"`// 声明对应的json key
    Created time.Time
}
```

Playground url: [https://play.golang.org/p/dqw...](https://play.golang.org/p/dqw6tLb4JWm)

### 解析内嵌对象数组的JSON(Embed Array of Object)

如果上面JOSN对象里的Fruit值现在变成了

```go
"Fruit" : [
    {
        "Name": "Apple",
            "PriceTag": "$1"
    },
    {
        "Name": "Pear",
        "PriceTag": "$1.5"
    }
]
```

这种情况也简单把解析JSON的结构体做如下更改,把Fruit字段类型换为 `[]Fruit`即可

```go
type Fruit struct {
    Name string `json:"Name"`
    PriceTag string `json:"PriceTag"`
}

type FruitBasket struct {
    Name    string 
    Fruit   []Fruit
    Id      int64 `json:"ref"`// 声明对应的json key
    Created time.Time
}
```

### 解析具有动态Key的对象（Parse a JSON object with dynamic key)

下面再做一下复杂的变通,如果把上面的对象数组变为Key为水果ID的对象（object of object）比如

```go
"Fruit" : {
    "1": {
        "Name": "Apple",
        "PriceTag": "$1"
    },
    "2": {
        "Name": "Pear",
        "PriceTag": "$1.5"
    }
}
```

每个Key的名字在声明结构体的时候是不知道值的,这样该怎么声明呢,答案是把Fruit字段的类型声明为一个key为string类型值为Fruit类型的map

```go
type Fruit struct {
    Name string `json:"Name"`
    PriceTag string `json:"PriceTag"`
}

type FruitBasket struct {
    Name    string 
    Fruit   map[string]Fruit
    Id      int64 `json:"ref"`// 声明对应的json key
    Created time.Time
}
```

示例代码

```go
package main

import (
    "fmt"
    "encoding/json"
    "time"
    
)

func main() {
    type Fruit struct {
        Name string `json:"Name"`
        PriceTag string `json:"PriceTag"`
    }

    type FruitBasket struct {
        Name    string 
        Fruit   map[string]Fruit
        Id      int64 `json:"ref"`// 声明对应的json key
        Created time.Time

    }    
    jsonData := []byte(`
    {
        "Name": "Standard",
        "Fruit" : {
        "1": {
        "Name": "Apple",
        "PriceTag": "$1"
        },
        "2": {
        "Name": "Pear",
        "PriceTag": "$1.5"
        }
        },
        "ref": 999,
        "Created": "2018-04-09T23:00:00Z"
    }`)

    var basket FruitBasket
    err := json.Unmarshal(jsonData, &basket)
    if err != nil {
         fmt.Println(err)
    }
    for _, item := range basket.Fruit {
    fmt.Println(item.Name, item.PriceTag)
    }
}
```

Playground url: [https://play.golang.org/p/fh8...](https://play.golang.org/p/fh8JKa6pKJS)

### 解析包含任意层级的数组和对象的JSON数据(arbitrary arrays and objects)

针对包含任意层级的JOSN数据,声明结构体类型比较困难,`encode\json`包还提供另外一种方法来解析JSON数据.

`encoding\json`包使用：

* map[string]interface{} 存储JOSN对象
* []interface 存储JOSN数组
  `json.Unmarshl` 将会把任何合法的JSON数据存储到一个interface{}类型的值,通过使用空接口类型我们可以存储任意值,但是使用这种类型作为值时需要先做一次类型断言.

示例代码:

```go
jsonData := []byte(`{"Name":"Eve","Age":6,"Parents":["Alice","Bob"]}`)

var v interface{}
json.Unmarshal(jsonData, &v)
data := v.(map[string]interface{})

for k, v := range data {
    switch v := v.(type) {
    case string:
        fmt.Println(k, v, "(string)")
    case float64:
        fmt.Println(k, v, "(float64)")
    case []interface{}:
        fmt.Println(k, "(array):")
        for i, u := range v {
            fmt.Println("    ", i, u)
        }
    default:
        fmt.Println(k, v, "(unknown)")
    }
}
```

虽然将JSON数据存储到空接口类型的值中可以用来解析任意结构的JSON数据,但是在实际应用中发现还是有不可控的地方,比如将数字字符串的值转换成了float类型的值,所以经常会在运行时报类型断言的错误,所以在JSON结构确定的情况下还是优先使用结构体类型声明,将JSON数据到结构体中的方式来解析JSON.



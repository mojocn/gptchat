---
layout: post
title: Go教程:13-map字典
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,map字典,kv是否存在,map删除del,map排序,map-for-range遍历
description:  Go语言教程,Golang教程,map字典,kv是否存在,map删除del,map排序,map-for-range遍历
permalink: /:categories/:title
coverage: golang_map.png
date: 2019-08-27T11:37:54+08:00
---

map 是一种特殊的数据结构：一种元素对（pair）的无序集合,pair 的一个元素是 key,对应的另一个元素是 value,所以这个结构也称为关联数组或字典.这是一种快速寻找值的理想结构：给定 key,对应的
value 可以迅速定位.

map 这种数据结构在其他编程语言中也称为字典（Python）,hash 和 HashTable 等.

## 1. 概念

***map 是引用类型***,可以使用如下声明：
在声明的时候不需要知道 map 的长度,map 是可以动态增长的.
未初始化的 map 的值是 nil.
``go
var map1 map[keytype]valuetype
var map1 map[string]int
``

### 1.1 key 可以是任意可以用 == 或者 != 操作符比较的类型

key 可以是任意可以用 == 或者 != 操作符比较的类型,比如 string,int,float.所以数组,切片和结构体不能作为 key (译者注：含有数组切片的结构体不能作为 key,只包含内建类型的 struct 是可以作为
key 的）,但是指针和接口类型可以.如果要用结构体作为 key 可以提供 Key() 和 Hash() 方法,这样可以通过结构体的域计算出唯一的数字或者字符串的 key.

### 1.2 value 可以是任意类型的

value 可以是任意类型的;通过使用空接口类型,我们可以存储任意值,但是使用这种类型作为值时需要先做一次类型断言

### 1.3 map 传递给函数的代价很小

map 是 引用类型 的： 内存用 make 方法来分配.

map 的初始化：var map1 = make(map[keytype]valuetype).

或者简写为：map1 := make(map[keytype]valuetype).

上面例子中的 mapCreated 就是用这种方式创建的：mapCreated := make(map[string]float32).

相当于：mapCreated := map[string]float32{}.

mapAssigned 也是 mapList 的引用,对 mapAssigned 的修改也会影响到 mapLit 的值.

### 1.4 new,永远用 make 来构造 map

## 2. key-value是否存

`val1, isPresent = map1[key1]`

isPresent 返回一个 bool 值：如果 key1 存在于 map1,val1 就是 key1 对应的 value 值,并且 isPresent为true;如果 key1 不存在,val1 就是一个空值,并且 isPresent 会返回 false.

## 3. map中删除key

直接 delete(map1, key1) 就可以.

如果 key1 不存在,该操作不会产生错误.

```go

package main
import "fmt"

func main() {
	var value int
	var isPresent bool

	map1 := make(map[string]int)
	map1["New Delhi"] = 55
	map1["Beijing"] = 20
	map1["Washington"] = 25
	value, isPresent = map1["Beijing"]
	if isPresent {
		fmt.Printf("The value of \"Beijing\" in map1 is: %d\n", value)
	} else {
		fmt.Printf("map1 does not contain Beijing")
	}

	value, isPresent = map1["Paris"]
	fmt.Printf("Is \"Paris\" in map1 ?: %t\n", isPresent)
	fmt.Printf("Value is: %d\n", value)

	// delete an item:
	delete(map1, "Washington")
	value, isPresent = map1["Washington"]
	if isPresent {
		fmt.Printf("The value of \"Washington\" in map1 is: %d\n", value)
	} else {
		fmt.Println("map1 does not contain Washington")
	}
}
```

## 4. for-range遍历map

```go
for key, value := range map1 {
	...
}
```

第一个返回值 key 是 map 中的 key 值,第二个返回值则是该 key 对应的 value 值;这两个都是仅 for 循环内部可见的局部变量.其中第一个返回值key值是一个可选元素.如果您只关心值,可以这么使用：

如果只想获取 key,您可以这么使用：

```go
for key := range map1 {
	fmt.Printf("key is: %d\n", key)
}
```

## 5. map 的排序

map 默认是无序的,不管是按照 key 还是按照 value 默认都不排序.

如果您想为 map 排序,需要将 key（或者 value）拷贝到一个切片,再对切片排序,然后可以使用切片的 for-range 方法打印出所有的 key 和 value.

```go
// the telephone alphabet:
package main
import (
	"fmt"
	"sort"
)

var (
	barVal = map[string]int{"alpha": 34, "bravo": 56, "charlie": 23,
							"delta": 87, "echo": 56, "foxtrot": 12,
							"golf": 34, "hotel": 16, "indio": 87,
							"juliet": 65, "kili": 43, "lima": 98}
)

func main() {
	fmt.Println("unsorted:")
	for k, v := range barVal {
		fmt.Printf("Key: %v, Value: %v / ", k, v)
	}
	keys := make([]string, len(barVal))
	i := 0
	for k, _ := range barVal {
		keys[i] = k
		i++
	}
	sort.Strings(keys)
	fmt.Println()
	fmt.Println("sorted:")
	for _, k := range keys {
		fmt.Printf("Key: %v, Value: %v / ", k, barVal[k])
	}
}
```

输出

```bash
unsorted:
Key: bravo, Value: 56 / Key: echo, Value: 56 / Key: indio, Value: 87 / Key: juliet, Value: 65 / Key: alpha, Value: 34 / Key: charlie, Value: 23 / Key: delta, Value: 87 / Key: foxtrot, Value: 12 / Key: golf, Value: 34 / Key: hotel, Value: 16 / Key: kili, Value: 43 / Key: lima, Value: 98 /
sorted:
Key: alpha, Value: 34 / Key: bravo, Value: 56 / Key: charlie, Value: 23 / Key: delta, Value: 87 / Key: echo, Value: 56 / Key: foxtrot, Value: 12 / Key: golf, Value: 34 / Key: hotel, Value: 16 / Key: indio, Value: 87 / Key: juliet, Value: 65 / Key: kili, Value: 43 / Key: lima, Value: 98 /
```

但是如果您想要一个排序的列表您最好使用结构体切片,这样会更有效：

```go
type name struct {
	key string
	value int
}
```


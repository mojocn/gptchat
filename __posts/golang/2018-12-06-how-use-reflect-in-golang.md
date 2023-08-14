---
layout: post
title: go代码示例:reflect反射
category: Golang
tags: golang reflect
description: go语言reflect包的用法,how to use reflect package in go.
keywords: reflect,golang,用法,反射
date: 2018-12-26T13:19:54+08:00
---

## 介绍

这篇文章使用一些列子来介绍 `reflect` 包的用法.
reflect包主要做一些`decoding/encoding`的事情.动态的调用函数.大部分的例子都是我之前项目中的代码.
如果有什么疑问或者有建议请在文章下面留言.
这里介绍一个go语言卡通图标的项目[@egonelbre/gophers](https://github.com/egonelbre/gophers).

## Reflect Usage

### 读取 struct 的 tag

这种用法在 gorm模型中,gin参数验证,beego动态路由,和json解析的时候用到过. 如果您写一些开源工具的时候也许会用到.

```go
package main

import (
	"fmt"
	"reflect"
)

type User struct {
	Email  string `mcl:"email"`
	Name   string `mcl:"name"`
	Age    int    `mcl:"age"`
	Github string `mcl:"github" default:"a8m"`
}

func main() {
	var u interface{} = User{}
	//TypeOf 返回 reflect.Type 表示 u的动态type
	t := reflect.TypeOf(u)
	//kind 返回类型
	if t.Kind() != reflect.Struct {
		return
	}
	//变量field
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		//获取tag的值
		fmt.Println(f.Tag.Get("mcl"), f.Tag.Get("default"))
	}
}
```

调用 `Kind()` 中的一个 [类型常量](https://golang.org/pkg/reflect/#Kind).

### 获取和设置结构体的属性值

```go
package main

import (
	"fmt"
	"reflect"
)

type User struct {
	Email  string `mcl:"email"`
	Name   string `mcl:"name"`
	Age    int    `mcl:"age"`
	Github string `mcl:"github" default:"a8m"`
}

func main() {
	u := &User{Name: "Ariel Mashraki"}
	// Elem returns the value that the pointer u points to.
	//得到u的指针
	v := reflect.ValueOf(u).Elem()
	f := v.FieldByName("Github")
	// make sure that this field is defined, and can be changed.
	//确保field 是有效的 也是可以写的
	if !f.IsValid() || !f.CanSet() {
		return
	}
	if f.Kind() != reflect.String || f.String() != "" {
		return
	}
	f.SetString("a8m")
	fmt.Printf("Github username was changed to: %q\n", u.Github)
}
```

### 向不知都类型的slice中添加字符 使用场景decoder

```go
package main

import (
	"fmt"
	"io"
	"reflect"
)

func main() {
	var (
		a []string
		b []interface{}
		c []io.Writer
	)
	fmt.Println(fill(&a), a) // pass
	fmt.Println(fill(&b), b) // pass
	fmt.Println(fill(&c), c) // fail
}

func fill(i interface{}) error {
	v := reflect.ValueOf(i)
	if v.Kind() != reflect.Ptr {
		return fmt.Errorf("non-pointer %v", v.Type())
	}
	// get the value that the pointer v points to.
	v = v.Elem()
	if v.Kind() != reflect.Slice {
		return fmt.Errorf("can't fill non-slice value")
	}
	v.Set(reflect.MakeSlice(v.Type(), 3, 3))
	// validate the type of the slice. see below.
	if !canAssign(v.Index(0)) {
		return fmt.Errorf("can't assign string to slice elements")
	}
	for i, w := range []string{"foo", "bar", "baz"} {
		v.Index(i).Set(reflect.ValueOf(w))
	}
	return nil
}

// we accept strings, or empty interfaces.
func canAssign(v reflect.Value) bool {
	return v.Kind() == reflect.String || (v.Kind() == reflect.Interface && v.NumMethod() == 0)
}
```

### 给数字类型变量设置值,场景decoder

```go
package main

import (
	"fmt"
	"reflect"
)

const n = 255

func main() {
	var (
		a int8
		b int16
		c uint
		d float32
		e string
	)
	fmt.Println(fill(&a), a)
	fmt.Println(fill(&b), b)
	fmt.Println(fill(&c), c)
	fmt.Println(fill(&d), c)
	fmt.Println(fill(&e), e)
}

func fill(i interface{}) error {
	v := reflect.ValueOf(i)
	if v.Kind() != reflect.Ptr {
		return fmt.Errorf("non-pointer %v", v.Type())
	}
	// get the value that the pointer v points to.
	v = v.Elem()
	switch v.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if v.OverflowInt(n) {
			return fmt.Errorf("can't assign value due to %s-overflow", v.Kind())
		}
		v.SetInt(n)
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
		if v.OverflowUint(n) {
			return fmt.Errorf("can't assign value due to %s-overflow", v.Kind())
		}
		v.SetUint(n)
	case reflect.Float32, reflect.Float64:
		if v.OverflowFloat(n) {
			return fmt.Errorf("can't assign value due to %s-overflow", v.Kind())
		}
		v.SetFloat(n)
	default:
		return fmt.Errorf("can't assign value to a non-number type")
	}
	return nil
}
```

### Decode key-value 到 map

```go
package main

import (
	"fmt"
	"reflect"
	"strconv"
	"strings"
)

func main() {
	var (
		m0 = make(map[int]string)
		m1 = make(map[int64]string)
		m2 map[interface{}]string
		m3 map[interface{}]interface{}
		m4 map[bool]string
	)
	s := "1=foo,2=bar,3=baz"
	fmt.Println(decodeMap(s, &m0), m0) // pass
	fmt.Println(decodeMap(s, &m1), m1) // pass
	fmt.Println(decodeMap(s, &m2), m2) // pass
	fmt.Println(decodeMap(s, &m3), m3) // pass
	fmt.Println(decodeMap(s, &m4), m4) // fail
}

func decodeMap(s string, i interface{}) error {
	v := reflect.ValueOf(i)
	if v.Kind() != reflect.Ptr {
		return fmt.Errorf("non-pointer %v", v.Type())
	}
	// get the value that the pointer v points to.
	v = v.Elem()
	t := v.Type()
	// allocate a new map, if v is nil. see: m2, m3, m4.
	if v.IsNil() {
		v.Set(reflect.MakeMap(t))
	}
	// assume that the input is valid.
	for _, kv := range strings.Split(s, ",") {
		s := strings.Split(kv, "=")
		n, err := strconv.Atoi(s[0])
		if err != nil {
			return fmt.Errorf("failed to parse number: %v", err)
		}
		k, e := reflect.ValueOf(n), reflect.ValueOf(s[1])
		// get the type of the key.
		kt := t.Key()
		if !k.Type().ConvertibleTo(kt) {
			return fmt.Errorf("can't convert key to type %v", kt.Kind())
		}
		k = k.Convert(kt)
		// get the element type.
		et := t.Elem()
		if et.Kind() != v.Kind() && !e.Type().ConvertibleTo(et) {
			return fmt.Errorf("can't assign value to type %v", kt.Kind())
		}
		v.SetMapIndex(k, e.Convert(et))
	}
	return nil
}
```

### Decode key-value 到结构体

```go
package main

import (
	"fmt"
	"reflect"
	"strings"
)

type User struct {
	Name    string
	Github  string
	private string
}

func main() {
	var (
		v0 User
		v1 *User
		v2 = new(User)
		v3 struct{ Name string }
		s  = "Name=Ariel,Github=a8m"
	)
	fmt.Println(decode(s, &v0), v0) // pass
	fmt.Println(decode(s, v1), v1)  // fail
	fmt.Println(decode(s, v2), v2)  // pass
	fmt.Println(decode(s, v3), v3)  // fail
	fmt.Println(decode(s, &v3), v3) // pass
}

func decode(s string, i interface{}) error {
	v := reflect.ValueOf(i)
	if v.Kind() != reflect.Ptr || v.IsNil() {
		return fmt.Errorf("decode requires non-nil pointer")
	}
	// get the value that the pointer v points to.
	v = v.Elem()
	// assume that the input is valid.
	for _, kv := range strings.Split(s, ",") {
		s := strings.Split(kv, "=")
		f := v.FieldByName(s[0])
		// make sure that this field is defined, and can be changed.
		if !f.IsValid() || !f.CanSet() {
			continue
		}
		// assume all the fields are type string.
		f.SetString(s[1])
	}
	return nil
}
```

### Encode 结构体到 key-value 对

```go
package main

import (
	"fmt"
	"reflect"
	"strings"
)

type User struct {
	Email   string `kv:"email,omitempty"`
	Name    string `kv:"name,omitempty"`
	Github  string `kv:"github,omitempty"`
	private string
}

func main() {
	var (
		u = User{Name: "Ariel", Github: "a8m"}
		v = struct {
			A, B, C string
		}{
			"foo",
			"bar",
			"baz",
		}
		w = &User{}
	)
	fmt.Println(encode(u))
	fmt.Println(encode(v))
	fmt.Println(encode(w))
}

// this example supports only structs, and assume their
// fields are type string.
func encode(i interface{}) (string, error) {
	v := reflect.ValueOf(i)
	t := v.Type()
	if t.Kind() != reflect.Struct {
		return "", fmt.Errorf("type %s is not supported", t.Kind())
	}
	var s []string
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		// skip unexported fields. from godoc:
		// PkgPath is the package path that qualifies a lower case (unexported)
		// field name. It is empty for upper case (exported) field names.
		if f.PkgPath != "" {
			continue
		}
		fv := v.Field(i)
		key, omit := readTag(f)
		// skip empty values when "omitempty" set.
		if omit && fv.String() == "" {
			continue
		}
		s = append(s, fmt.Sprintf("%s=%s", key, fv.String()))
	}
	return strings.Join(s, ","), nil
}

func readTag(f reflect.StructField) (string, bool) {
	val, ok := f.Tag.Lookup("kv")
	if !ok {
		return f.Name, false
	}
	opts := strings.Split(val, ",")
	omit := false
	if len(opts) == 1 {
		omit = opts[1] == "omitempty"
	}
	return opts[0], omit
}
```

### 检查某个对象是否实现 interface 方法

```go
package main

import (
	"fmt"
	"reflect"
)

type Marshaler interface {
	MarshalKV() (string, error)
}

type User struct {
	Email   string `kv:"email,omitempty"`
	Name    string `kv:"name,omitempty"`
	Github  string `kv:"github,omitempty"`
	private string
}

func (u User) MarshalKV() (string, error) {
	return fmt.Sprintf("name=%s,email=%s,github=%s", u.Name, u.Email, u.Github), nil
}

func main() {
	fmt.Println(encode(User{"boring", "Ariel", "a8m", ""}))
	fmt.Println(encode(&User{Github: "posener", Name: "Eyal", Email: "boring"}))
}

var marshalerType = reflect.TypeOf(new(Marshaler)).Elem()

func encode(i interface{}) (string, error) {
	t := reflect.TypeOf(i)
	if !t.Implements(marshalerType) {
		return "", fmt.Errorf("encode only supports structs that implement the Marshaler interface")
	}
	m, _ := reflect.ValueOf(i).Interface().(Marshaler)
	return m.MarshalKV()
}
```

### 调用函数

#### 不带参数没有返回值调用函数

```go
package main

import (
	"fmt"
	"reflect"
)

type A struct{}

func (A) Hello() { fmt.Println("World") }

func main() {
	// ValueOf returns a new Value, which is the reflection interface to a Go value.
	v := reflect.ValueOf(A{})
	m := v.MethodByName("Hello")
	if m.Kind() != reflect.Func {
		return
	}
	m.Call(nil)
}
```

#### 带一系列参数调用函数验证并返回值

```go
package main

import (
	"fmt"
	"reflect"
)

func Add(a, b int) int { return a + b }

func main() {
	v := reflect.ValueOf(Add)
	if v.Kind() != reflect.Func {
		return
	}
	t := v.Type()
	argv := make([]reflect.Value, t.NumIn())
	for i := range argv {
		// validate the type of parameter "i".
		if t.In(i).Kind() != reflect.Int {
			return
		}
		argv[i] = reflect.ValueOf(i)
	}
	// note that, len(result) == t.NumOut()
	result := v.Call(argv)
	if len(result) != 1 || result[0].Kind() != reflect.Int {
		return
	}
	fmt.Println(result[0].Int())
}
```

#### 动态调用函数,类似于 `template/text` 包

可以用在写自己的动态路由

{% raw %}

```go
package main

import (
	"fmt"
	"html/template"
	"reflect"
	"strconv"
	"strings"
)
func main() {
	funcs := template.FuncMap{
		"trim":    strings.Trim,
		"lower":   strings.ToLower,
		"repeat":  strings.Repeat,
		"replace": strings.Replace,
	}
	fmt.Println(eval(`{{ "hello" 4 | repeat }}`, funcs))
	fmt.Println(eval(`{{ "Hello-World" | lower }}`, funcs))
	fmt.Println(eval(`{{ "foobarfoo" "foo" "bar" -1 | replace }}`, funcs))
	fmt.Println(eval(`{{ "-^-Hello-^-" "-^" | trim }}`, funcs))
}


// evaluate an expression. note that this implemetation is assuming that the
// input is valid, and also very limited. for example, whitespaces are not allowed
// inside a quoted string.
func eval(s string, funcs template.FuncMap) (string, error) {
	args, name := parseArgs(s)
	fn, ok := funcs[name]
	if !ok {
		return "", fmt.Errorf("function %s is not defined", name)
	}
	v := reflect.ValueOf(fn)
	t := v.Type()
	if len(args) != t.NumIn() {
		return "", fmt.Errorf("invalid number of arguments. got: %v, want: %v", len(args), t.NumIn())
	}
	argv := make([]reflect.Value, len(args))
	// go over the arguments, validate and build them.
	// note that we support only int, and string in this simple example.
	for i := range argv {
		var argType reflect.Kind
		// if the argument "i" is string.
		if strings.HasPrefix(args[i], "\"") {
			argType = reflect.String
			argv[i] = reflect.ValueOf(strings.Trim(args[i], "\""))
		} else {
			argType = reflect.Int
			// assume that the input is valid.
			num, _ := strconv.Atoi(args[i])
			argv[i] = reflect.ValueOf(num)
		}
		if t.In(i).Kind() != argType {
			return "", fmt.Errorf("Invalid argument. got: %v, want: %v", argType, t.In(i).Kind())
		}
	}
	result := v.Call(argv)
	// in real-world code, we validate it before executing the function,
	// using the v.NumOut() method. similiar to the text/template package.
	if len(result) != 1 || result[0].Kind() != reflect.String {
		return "", fmt.Errorf("function %s must return a one string value", name)
	}
	return result[0].String(), nil
}

// parseArgs is an auxiliary function, that extract the function and its
// parameter from the given expression.
func parseArgs(s string) ([]string, string) {
	args := strings.Split(strings.Trim(s, "{ }"), "|")
	return strings.Split(strings.Trim(args[0], " "), " "), strings.Trim(args[len(args)-1], " ")
}
```

{% endraw %}

#### 调用可变参数函数

```go
package main

import (
	"fmt"
	"math/rand"
	"reflect"
)

func Sum(x1, x2 int, xs ...int) int {
	sum := x1 + x2
	for _, xi := range xs {
		sum += xi
	}
	return sum
}

func main() {
	v := reflect.ValueOf(Sum)
	if v.Kind() != reflect.Func {
		return
	}
	t := v.Type()
	argc := t.NumIn()
	if t.IsVariadic() {
		argc += rand.Intn(10)
	}
	argv := make([]reflect.Value, argc)
	for i := range argv {
		argv[i] = reflect.ValueOf(i)
	}
	result := v.Call(argv)
	fmt.Println(result[0].Int()) // assume that t.NumOut() > 0 tested above.
}
```

### 在runtime中创建函数

```go
package main

import (
	"fmt"
	"reflect"
)

type Add func(int64, int64) int64

func main() {
	t := reflect.TypeOf(Add(nil))
	mul := reflect.MakeFunc(t, func(args []reflect.Value) []reflect.Value {
		a := args[0].Int()
		b := args[1].Int()
		return []reflect.Value{reflect.ValueOf(a+b)}
	})
	fn, ok := mul.Interface().(Add)
	if !ok {
		return
	}
	fmt.Println(fn(2,3))
}
```

## 修改权限

```go
//相当于cd 改变当前的工作目录到 dir 工作目录
func Chdir(dir string) error
//chmod
func Chmod(name string, mode FileMode) error
//chown
func Chown(name string, uid, gid int) error
//修改文件的时间戳
func Chtimes(name string, atime time.Time, mtime time.Time) error
```
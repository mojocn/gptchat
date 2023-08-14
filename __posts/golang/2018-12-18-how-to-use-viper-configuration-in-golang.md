---
layout: post
title: Go进阶03:怎么使用viper管理配置
category: Golang
tags: Go进阶
description: viper是一个方便Go语言应用程序处理配置信息的库.它可以处理多种格式的配置.它支持的特性,这里有几个example使用示例.
keywords: golang,go语言,viper使用.spf13/viper,example
date: 2018-12-26T13:19:54+08:00
---

## 1.Viper 是什么?

viper 是以个完善的go语言配置包.开发它的目的是来处理各种格式的配置文件信息.

viper 支持:

- 设置默认配置
- 支持读取JSON TOML YAML HCL 和Java属性配置文件
- (可选)监听配置文件变化,实时读取读取配置文件内容
- 读取环境变量值
- 读取远程配置系统(etcd Consul)和监控配置变化
- 读取命令哈Flag值
- 读取buffer值
- 读取确切值

## 2.为什么要使用 Viper?

当您创建app的时候需要关注怎么创建完美的app,而不需要关注怎么写配置文件.

viper 能够帮您做这些事情

- 找到和反序列化JSON TOML YAML HCL JAVA配置文件
- 提供一个配置文件默认值和可选值的机制
- 提供重写配置值和Flag的可选值
- 提供系统的参数别名,解决对以有代码的侵入
- 轻松的辨别出用户输入值还是配置文件值

**viper 配置项key是大写不敏感的**

## 3.Viper 基本用法

```go
package main

import (
	"fmt"
	"github.com/spf13/viper"
	"log"
)

func init() {
	viper.SetConfigName("config") //指定配置文件的文件名称(不需要制定配置文件的扩展名)
	//viper.AddConfigPath("/etc/appname/")   //设置配置文件的搜索目录
	//viper.AddConfigPath("$HOME/.appname")  // 设置配置文件的搜索目录
	viper.AddConfigPath(".")    // 设置配置文件和可执行二进制文件在用一个目录
	err := viper.ReadInConfig() // 根据以上配置读取加载配置文件
	if err != nil {
		log.Fatal(err)// 读取配置文件失败致命错误
	}
}

func main()  {
		
	fmt.Println("获取配置文件的string",viper.GetString(`app.name`))
	fmt.Println("获取配置文件的string",viper.GetInt(`app.foo`))
	fmt.Println("获取配置文件的string",viper.GetBool(`app.bar`))
	fmt.Println("获取配置文件的map[string]string",viper.GetStringMapString(`app`))
		
}
```

代码详解

- `viper.SetConfigName("config")` 设置配置文件名为config, 不需要配置文件扩展名, 配置文件的类型 viper会自动根据扩展名自动匹配.
- `viper.AddConfigPath(".")`设置配置文件搜索的目录, `.` 表示和当前编译好的二进制文件在同一个目录. 可以添加多个配置文件目录,如在第一个目录中找到就不不继续到其他目录中查找.
- `viper.ReadInConfig()` 加载配置文件内容
- `viper.Get***` 获取配置文件中配置项的信息

[viper基本用法代码地址](https://github.com/libragen/dejavuzhou.github.io/tree/master/tutorials/viper_basic)

## 4.viper 高级用法

### 4.1 viper设置配置项的默认值

默认值不是必须的,如果配置文件,环境变量,远程配置系统,命令行参数,Set函数都没有指定时,默认值将起作用.
例子:

```go
viper.SetDefault("ContentDir", "content")
viper.SetDefault("LayoutDir", "layouts")
viper.SetDefault("Taxonomies", map[string]string{"tag": "tags", "category": "categories"})
Reading Config Files
```

**viper 配置项key是是大写不敏感的**

### 4.2 监听和重新读取配置文件

Viper支持JSON,TOML,YAML,HCL和Java properties文件.
Viper可以搜索多个路径,但目前单个Viper实例仅支持单个配置文件.
Viper默认不搜索任何路径.
以下是如何使用Viper搜索和读取配置文件的示例.
路径不是必需的,但最好至少应提供一个路径,以便找到一个配置文件.

Viper支持让您的应用程序在运行时拥有读取配置文件的能力.
需要重新启动服务器以使配置生效的日子已经一去不复返了,由viper驱动的应用程序可以在运行时读取已更新的配置文件,并且不会错过任何节拍.
只需要调用viper实例的WatchConfig函数,您也可以指定一个回调函数来获得变动的通知.

```go
viper.WatchConfig()
viper.OnConfigChange(func(e fsnotify.Event) {
	//viper配置发生变化了 执行响应的操作
	fmt.Println("Config file changed:", e.Name)
})
```

### 4.3 从io.Reader中读取配置信息(不常用)

Viper预先定义了许多配置源,例如文件,环境变量,命令行参数和远程K / V存储系统,但您并未受其约束.
您也可以实现自己的配置源,并提供给viper.

`viper.SetConfigType` 设置配置文件的类型

```go
viper.SetConfigType("yaml") // 设置配置文件的类型

// 配置文件内容
var yamlExample = []byte(`
Hacker: true
name: steve
hobbies:
- skateboarding
- snowboarding
- go
clothing:
  jacket: leather
  trousers: denim
age: 35
eyes : brown
beard: true
`)
//创建io.Reader
viper.ReadConfig(bytes.NewBuffer(yamlExample))

viper.Get("name") // this would be "steve"
```

### 4.4 重写viper的配置项的值

可以重写命令行的Flag值,也可以是普通的配置项值

```go
viper.Set("Verbose", true)
viper.Set("LogFile", LogFile)//命令行flag
```

### 4.5 注册和使用别名

让一个配置项被多个别名配置项使用

```go
viper.RegisterAlias("loud", "Verbose")

viper.Set("verbose", true) // same result as next line
viper.Set("loud", true)   // same result as prior line

viper.GetBool("loud") // true
viper.GetBool("verbose") // true
```

### 4.6 viper 和环境变量一起使用

Viper 完全支持环境变量,这是的应用程序可以开箱即用.

有四个和环境变量有关的方法：

- AutomaticEnv()
- BindEnv(string...) : error
- SetEnvPrefix(string)
- SetEnvKeyReplacer(string...) *strings.Replacer

注意,环境变量时区分大小写的.

Viper提供了一种机制来确保Env变量是唯一的.通过SetEnvPrefix,在从环境变量读取时会添加设置的前缀.BindEnv和AutomaticEnv都会使用到这个前缀.

BindEnv需要一个或两个参数.第一个参数是键名,第二个参数是环境变量的名称.环境变量的名称区分大小写.如果未提供ENV变量名称,则Viper会自动假定该键名称与ENV变量名称匹配,并且ENV变量为全部大写.当您显式提供ENV变量名称时,它不会自动添加前缀.

使用ENV变量时要注意,当关联后,每次访问时都会读取该ENV值.Viper在BindEnv调用时不读取ENV值.

AutomaticEnv与SetEnvPrefix结合将会特别有用.当AutomaticEnv被调用时,任何viper.Get请求都会去获取环境变量.环境变量名为SetEnvPrefix设置的前缀,加上对应名称的大写.

SetEnvKeyReplacer允许您使用一个strings.Replacer对象来将配置名重写为Env名.如果您想在Get()中使用包含-的配置名 ,但希望对应的环境变量名包含_分隔符,就可以使用该方法.

例子：

```go
SetEnvPrefix("spf") //会自动转换成大写
BindEnv("id")

os.Setenv("SPF_ID", "13") // 一般在app 外部设置

id := Get("id") // 13
```

### 4.7 跟命令行Flag一起使用(很少使用)

使用`github.com/spf13/pflag`作为桥梁让viper绑定标准库flag值

Viper支持绑定pflags参数.
和BindEnv一样,当绑定方法被调用时,该值没有被获取,而是在被访问时获取.这意味着应该尽早进行绑定,甚至是在init()函数中绑定.

利用BindPFlag()方法可以绑定单个flag.

使用pflag并不影响其他库使用标准库中的flag.通过导入,pflag可以接管通过标准库的flag定义的参数.这是通过调用pflag包中的AddGoFlagSet()方法实现的.

```go
package main

import (
	"flag"
	"github.com/spf13/pflag"
)

func main() {

	// 标准库Flag
	flag.Int("flagname", 1234, "help message for flagname")

	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
	//解析flag
	pflag.Parse()
	//viper绑定pflag
	viper.BindPFlags(pflag.CommandLine)

	i := viper.GetInt("flagname") // retrieve value from viper

	...
}
```

### 4.8 获取远程配置

使用`github.com/spf13/viper/remote`包
`import _ "github.com/spf13/viper/remote"`

Viper 可以从例如etcd,Consul的远程Key/Value存储系统的一个路径上,读取一个配置字符串（JSON, TOML, YAML或HCL格式）.
这些值优先于默认值,但会被从磁盘文件,命令行flag,环境变量的配置所覆盖.

Viper 使用 crypt 来从 K/V 存储系统里读取配置,这意味着您可以加密储存您的配置信息,并且可以自动解密配置信息.加密是可选的.

您可以将远程配置与本地配置结合使用,也可以独立使用.

crypt 有一个命令行工具可以帮助您存储配置信息到K/V存储系统,crypt默认使用 http://127.0.0.1:4001 上的

#### etcd

```go
//设置远程配置
viper.AddRemoteProvider("etcd", "http://127.0.0.1:4001","/config/hugo.json")
//因为没有文件扩展名
//制定type
viper.SetConfigType("json") // because there is no file extension in a stream of bytes, supported extensions are "json", "toml", "yaml", "yml", "properties", "props", "prop"
//读取配置
err := viper.ReadRemoteConfig()
//使用viper.Get 获取配置值
```

#### Consul

```go
viper.AddRemoteProvider("consul", "localhost:8500", "MY_CONSUL_KEY")
viper.SetConfigType("json") // Need to explicitly set this to json
err := viper.ReadRemoteConfig()

fmt.Println(viper.Get("port")) // 8080
fmt.Println(viper.Get("hostname")) // myhostname.com
```

## 5.获取Viper配置项的值

一下是viper获取配置项值的方法

* `Get(key string) : interface{}`
* `GetBool(key string) : bool`
* `GetFloat64(key string) : float64`
* `GetInt(key string) : int`
* `GetString(key string) : string`
* `GetStringMap(key string) : map[string]interface{}`
* `GetStringMapString(key string) : map[string]string`
* `GetStringSlice(key string) : []string`
* `GetTime(key string) : time.Time`
* `GetDuration(key string) : time.Duration`
* `IsSet(key string) : bool`
* `AllSettings() : map[string]interface{}`

**如果配置项没有找到会获取的是零值**

**使用`viper.IsSet()`判断是否有这个配置项**

## 获取嵌套配置项的值

json配置文件内容如下

```json
{
    "host": {
        "address": "localhost",
        "port": 5799
    },
    "datastore": {
        "metric": {
            "host": "127.0.0.1",
            "port": 3099
        },
        "warehouse": {
            "host": "198.0.0.1",
            "port": 2112
        }
    }
}

```

viper 使用`.`语法来获取嵌套配置项值

```go
viper.GetString("datastore.metric.host") // (returns "127.0.0.1")
```

这遵守前面确立的优先规则; 会搜索路径中所有配置,直到找到为止.
例如,上面的文件,datastore.metric.host和 datastore.metric.port都已经定义（并且可能被覆盖）.如果另外 datastore.metric.protocol的默认值,Viper也会找到它.

但是,如果datastore.metric值被覆盖（通过标志,环境变量,Set方法,...）,则所有datastore.metric的子键将会未定义,它们被优先级更高的配置值所“遮蔽”.

## 6.使用单个viper还是多个viper

Viper随时准备使用开箱即用.没有任何配置或初始化也可以使用Viper.由于大多数应用程序都希望使用单个存储中心进行配置,因此viper包提供了此功能.它类似于一个单例模式.

在上面的所有示例中,他们都演示了如何使用viper的单例风格的方式.

## 7.使用多个viper实例

您还可以创建多不同的viper实例以供您的应用程序使用.每实例都有自己独立的设置和配置值.每个实例可以从不同的配置文件,K/V存储系统等读取.viper包支持的所有函数也都有对应的viper实例方法.

```go
x := viper.New()
y := viper.New()

x.SetDefault("ContentDir", "content")
y.SetDefault("ContentDir", "foobar")
```

当使用多个viper实例时,用户需要自己管理每个实例.

## 8.总结

[viper是一个非常简单强大的配置工具包](https://github.com/spf13/viper),支持多种配置文件,获取值简单,配置[spf13/cobra](https://github.com/spf13/cobra)一起使用简简直完美

Viper具有很好的API可以用, 并且很方便扩展, 并且不会妨碍我们正常的应用代码.
Viper也可以处理很多种文件类型作为配置源 - 例如JSON, YAML,TOML... 普通属性文件. Viper可以为我们从OS读取环境变量, 相当整洁.
一旦初始化并产生后,我们的配置总是可以使用各种的viper.Get函数获取来使用,确实很方便.

最后推荐一个简短[TOML配置文件教程](https://mojotv.cn/2018/11/07/what-is-toml.html)
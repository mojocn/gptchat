---
layout: post
title: Go进阶28:Go语言处理时区
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,timezone,时区
description:  Go语言教程,Golang教程,时间时区的转换和处理
permalink: /go/:title
coverage: time_zone.png
date: 2019-09-23T12:22:54+08:00
---

很多Golang初学者都不知道怎么来处理时区问题.这篇文章将解释清楚一下两个问题:

1. 怎么把带时区的时间保存到数据库?
2. 在Go语言中怎么解析带时区的时间?

## 1. 数据库时区(Time Zone)原则

时间保存到数据库中要总是使用一个统一的时区,理想的状态是保存UTC时区.更绝需求来转换成需要的时区.

我们拿MySQL保存时间为例子,其他类型数据库也使用.
在MySQL官方文档中,有两种程序时间的类型:

- ***DATETIME***: DATETIME 长度8个字节,保存格式为 `YYYYMMDDHHMMSS`（年月日时分秒）的整数,
  所以它与时区无关,存入的是什么值就是什么值,不会根据当前时区进行转换,支持范围 `1000-01-01 00:00:00` 到 `9999-12-31 23:59:59`
- ***TIMESTAMP***: TIMESTAMP 长度4字节,存入的是自1970-01-01午夜(格林尼治标准时间)以来的秒数,
  它和unix时间戳相同.所以它与时区有关,查询时转为相应的时区时间.

现在最重要的事情是怎么来做时区的转换.

## 2. Go语言时间时区的转换

下面的代码是展示我们如何在Go语言中做时区的转换.
首先让我们来定义地区和时区的的字典. 时区列表IANA时区标识可以从这里得到[Time Zones](https://www.php.net/manual/zh/timezones.php),

```go
package main

import (
	"fmt"
	"errors"
	"time"
)

type Country string

const (
	Germany Country = "Germany"
	UnitedStates Country  = "United States"
	China Country = "China"

)

// timeZoneID 是国家=>IANA 标准时区标识符 的键值对字典
var timeZoneID = map[Country]string{
	Germany:      "Europe/Berlin",
	UnitedStates: "America/Los_Angeles",
	China:   "Asia/Shanghai",
}

//获取 IANA 时区标识符
func (c Country) TimeZoneID() (string, error) {
	if id, ok := timeZoneID[c]; ok {
		return id, nil
	}
	return "", errors.New("timezone id not found for country")
}

// 获取tz时区标识符的格式化时间字符
func TimeIn(t time.Time, tz, format string) string {
	
	// https:/golang.org/pkg/time/#LoadLocation loads location on
	// 加载时区
	loc, err := time.LoadLocation(tz)
	if err != nil {
		//handle error
	}
	// 获取指定时区的格式化时间字符串
	return t.In(loc).Format(format)
}

func main() {
	// 获取美国的时区结构体
	tz, err := UnitedStates.TimeZoneID()
	if err != nil {
		//handle error
	}
    //格式化成美国的时区
	usTime := TimeIn(time.Now(), tz, time.RFC3339)

	fmt.Printf("Time in %s: %s",
		UnitedStates,
		usTime,
	)
}
```

## 3. Go语言time.LoadLocation可能的坑

正如标准库文档中所说的:
> The time zone database needed by LoadLocation may not be present on all systems, especially non-Unix systems. LoadLocation looks in the directory or uncompressed zip file named
> by the ZONEINFO environment variable, if any, then looks in known installation locations on Unix systems, and finally looks in $GOROOT/lib/time/zoneinfo.zip.

LoadLocation所需的时区数据库可能并不存在于所有系统上,尤其是非unix系统.
如果有的话,LoadLocation查找由ZONEINFO环境变量命名的目录或未压缩的 `ZONEINFO` 环境变量命名的zip文件,
然后查找Unix系统上已知的安装位置,最后查找 `$GOROOT/lib/time/ ZONEINFO .zip`.

## 4. Docker Go语言使用时区

默认的情况下时区信息文件时在Go安装的时候已经存在.
但是万一您部署和编译docker使用的时 multi-stage-docker Alpine 镜像.您可以手动的使用一下命令来添加时区的数据.

```yml
RUN apk add tzdata
```

这将把时区信息添加到 alpine 镜像的 `/usr/share/timezone`.
但是也不要忘记设置环境变量  `ZONEINFO` 的值为 `/usr/share/timezone`

```yaml
ZONEINFO=/usr/share/timezone
```

这里有一个参考的示例 Dockerfile

```dockerfile
FROM golang:1.12-alpine as build_base
RUN apk add --update bash make git
WORKDIR /go/src/github.com/your_repo/your_app/
ENv GO111MODULE on
COPY go.mod .
COPY go.sum .
RUN go mod download

FROM build_bash AS server_builder
COPY . ./
RUN GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /go/bin/your_app

FROM alpine
RUN apk add tzdata

# 自定义运行阶段的命令 
```
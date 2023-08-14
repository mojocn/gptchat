---
layout: post
title: "Go进阶37:重构我的base64Captcha图形验证码项目"
category: Golang
tags: Go进阶 
keywords: "Go语言教程,Golang教程,图形验证码,base64,captcha"
description: "golang,package,base64,captcha"
coverage: notbot.jpg
permalink: /go/:title
date: 2019-12-12T15:07:45+08:00
---

[![Go Report Card](https://goreportcard.com/badge/github.com/mojocn/base64Captcha)](https://goreportcard.com/report/github.com/mojocn/base64Captcha)
[![GoDoc](https://godoc.org/github.com/mojocn/base64Captcha?status.svg)](https://godoc.org/github.com/mojocn/base64Captcha)
[![Build Status](https://travis-ci.org/mojocn/base64Captcha.svg?branch=master)](https://travis-ci.org/mojocn/base64Captcha)
[![codecov](https://codecov.io/gh/mojocn/base64Captcha/branch/master/graph/badge.svg)](https://codecov.io/gh/mojocn/base64Captcha)
![stability-stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)
[![Foundation](https://img.shields.io/badge/Golang-Foundation-green.svg)](http://golangfoundation.org)

[🎃Base64captcha🎃](https://github.com/mojocn/base64Captcha) 几行代码就可以定义自己内容的图形验证码库,支持任意unicode字符的内容.

## 1. 📒 文档&Demo 📒

* [English](https://godoc.org/github.com/mojocn/base64Captcha)
* [中文文档](https://github.com/mojocn/base64Captcha/blob/master/README_zh.md)
* [Playground](https://captcha.mojotv.cn)

## 2. 🚀 快速上手 🚀

### 2.1 📥 下载base64Captcha包 📥

    go get -u github.com/mojocn/base64Captcha

### 2.2 🏂 在您的项目中使用base64Captcha 🏂

#### 2.2.1 🏇 实现[Store interface](https://github.com/mojocn/base64Captcha/blob/master/interface_store.go) 或者使用自带memory store 🏇

- [Build-in Memory Store](https://github.com/mojocn/base64Captcha/blob/master/store_memory.go)(只支持单机部署,多台服务器请自定义redis store)

```go
type Store interface {
	// Set sets the digits for the captcha id.
	Set(id string, value string)

	// Get returns stored digits for the captcha id. Clear indicates
	// whether the captcha must be deleted from the store.
	Get(id string, clear bool) string
	
    //Verify captcha's answer directly
	Verify(id, answer string, clear bool) bool
}

```

#### 2.2.2 🏄 实现[Driver interface](https://github.com/mojocn/base64Captcha/blob/master/interface_driver.go) 或者使用自带 drivers 🏄

包自带driver:

1. [Driver Digit](https://github.com/mojocn/base64Captcha/blob/master/driver_digit.go)
2. [Driver String](https://github.com/mojocn/base64Captcha/blob/master/driver_string.go)
3. [Driver Math](https://github.com/mojocn/base64Captcha/blob/master/driver_math.go)
4. [Driver Chinese](https://github.com/mojocn/base64Captcha/blob/master/driver_chinses.go)

```go
// Driver captcha interface for captcha engine to to write staff
type Driver interface {
	//DrawCaptcha draws binary item
	DrawCaptcha(content string) (item Item, err error)
	//GenerateIdQuestionAnswer creates rand id, content and answer
	GenerateIdQuestionAnswer() (id, q, a string)
}
```

#### 2.2.3 🚴 核心代码[captcha.go](https://github.com/mojocn/base64Captcha/blob/master/captcha.go) 🚴

captcha.go 是package的入口文件,源代码逻辑非常简单,如下:

```go
func init() {
	//init rand seed
	rand.Seed(time.Now().UnixNano())
}

// Captcha captcha basic information.
type Captcha struct {
	Driver Driver
	Store  Store
}

func NewCaptcha(driver Driver, store Store) *Captcha {
	return &Captcha{Driver: driver, Store: store}
}

//Generate generates a random id, base64 image string or an error if any
func (c *Captcha) Generate() (id, b64s string, err error) {
	id,content, answer := c.Driver.GenerateIdQuestionAnswer()
	item, err := c.Driver.DrawCaptcha(content)
	if err != nil {
		return "", "", err
	}
	c.Store.Set(id, answer)
	b64s = item.EncodeB64string()
	return
}
//if you has multiple captcha instances which shares a same store. You may want to use `store.Verify` method instead.
//Verify by given id key and remove the captcha value in store, return boolean value.
func (c *Captcha) Verify(id, answer string, clear bool) (match bool) {
	match = c.Store.Get(id, clear) == answer
	return
}

```

#### 2.2.4 🚵 生成Base64(image/audio)验证码字符串 🚵

```go
//Generate generates a random id, base64 image string or an error if any
func (c *Captcha) Generate() (id, b64s string, err error) {
	id,content, answer := c.Driver.GenerateIdQuestionAnswer()
	item, err := c.Driver.DrawCaptcha(content)
	if err != nil {
		return "", "", err
	}
	c.Store.Set(id, answer)
	b64s = item.EncodeB64string()
	return
}
```

#### 2.2.5 🤸 校验验证码内容 🤸

```go
//if you has multiple captcha instances which shares a same store. You may want to use `store.Verify` method instead.
//Verify by given id key and remove the captcha value in store, return boolean value.
func (c *Captcha) Verify(id, answer string, clear bool) (match bool) {
	match = c.Store.Get(id, clear) == answer
	return
}
```

#### 2.2.6 🏃 完整实例代码 🏃

```go
// example of HTTP server that uses the captcha package.
package main

import (
	"encoding/json"
	"fmt"
	"github.com/mojocn/base64Captcha"
	"log"
	"net/http"
)

//configJsonBody json request body.
type configJsonBody struct {
	Id            string
	CaptchaType   string
	VerifyValue   string
	DriverAudio   *base64Captcha.DriverAudio
	DriverString  *base64Captcha.DriverString
	DriverChinese *base64Captcha.DriverChinese
	DriverMath    *base64Captcha.DriverMath
	DriverDigit   *base64Captcha.DriverDigit
}

var store = base64Captcha.DefaultMemStore

// base64Captcha create http handler
func generateCaptchaHandler(w http.ResponseWriter, r *http.Request) {
	//parse request parameters
	decoder := json.NewDecoder(r.Body)
	var param configJsonBody
	err := decoder.Decode(&param)
	if err != nil {
		log.Println(err)
	}
	defer r.Body.Close()
	var driver base64Captcha.Driver

	//create base64 encoding captcha
	switch param.CaptchaType {
	case "audio":
		driver = param.DriverAudio
	case "string":
		driver = param.DriverString.ConvertFonts()
	case "math":
		driver = param.DriverMath.ConvertFonts()
	case "chinese":
		driver = param.DriverChinese.ConvertFonts()
	default:
		driver = param.DriverDigit
	}
	c := base64Captcha.NewCaptcha(driver, store)
	id, b64s, err := c.Generate()
	body := map[string]interface{}{"code": 1, "data": b64s, "captchaId": id, "msg": "success"}
	if err != nil {
		body = map[string]interface{}{"code": 0, "msg": err.Error()}
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(body)
}

// base64Captcha verify http handler
func captchaVerifyHandle(w http.ResponseWriter, r *http.Request) {

	//parse request json body
	decoder := json.NewDecoder(r.Body)
	var param configJsonBody
	err := decoder.Decode(&param)
	if err != nil {
		log.Println(err)
	}
	defer r.Body.Close()
	//verify the captcha
	body := map[string]interface{}{"code": 0, "msg": "failed"}
	if store.Verify(param.Id, param.VerifyValue, true) {
		body = map[string]interface{}{"code": 1, "msg": "ok"}
	}
	//set json response
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	json.NewEncoder(w).Encode(body)
}

//start a net/http server
func main() {
	//serve Vuejs+ElementUI+Axios Web Application
	http.Handle("/", http.FileServer(http.Dir("./static")))

	//api for create captcha
	http.HandleFunc("/api/getCaptcha", generateCaptchaHandler)

	//api for verify captcha
	http.HandleFunc("/api/verifyCaptcha", captchaVerifyHandle)

	fmt.Println("Server is at :8777")
	if err := http.ListenAndServe(":8777", nil); err != nil {
		log.Fatal(err)
	}
}
```

### 2.3 🎬　使用历史版本　🎬

[v1.2.2](https://github.com/mojocn/base64Captcha/tree/v1.2.2)

` go get github.com/mojocn/base64Captcha@v1.2.2 `

## 3. 🎨 定制自己的图形验证码 🎨

您那个定制自己的图形验码内容,只需实现 [interface driver](https://github.com/mojocn/base64Captcha/blob/master/interface_driver.go)
和 [interface item](https://github.com/mojocn/base64Captcha/blob/master/interface_item.go).

下面是几个可以参考的driver实现示例:

1. [DriverMath](https://github.com/mojocn/base64Captcha/blob/master/driver_math.go)
2. [DriverChinese](https://github.com/mojocn/base64Captcha/blob/master/driver_chinese.go)
3. [ItemChar](https://github.com/mojocn/base64Captcha/blob/master/item_char.go)

***您甚至可以设计[captcha struct](captcha.go)成您想要的功能***

## 4. 💖 致谢 💖

- [dchest/captha](https://github.com/dchest/captcha)
- [@slayercat](https://github.com/slayercat)
- [@amzyang](https://github.com/amzyang)
- [@Luckyboys](https://github.com/Luckyboys)

## 5. 🍭 Licence 🍭

base64Captcha source code is licensed under the Apache Licence, Version 2.0
(http://www.apache.org/licenses/LICENSE-2.0.html).

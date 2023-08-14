---
layout: post
title: "Kong网关(二):开启OAuth2 Plugin插件"
category: Misc
tags: Gateway 网关
keywords: "Kong网关插件 OAuth2 "
description: "kong 网关 service 服务 route 路由 consumer 消费者 概念解释"
coverage: kong_oauth2.png
permalink: /misc/:title
date: 2019-11-18T11:23:45+08:00
---

OAuth2.0是OAuth协议的延续版本,但不向前兼容OAuth 1.0(即完全废止了OAuth1.0). OAuth 2.0关注客户端开发者的简易性.
要么通过组织在资源拥有者和HTTP服务商之间的被批准的交互动作代表用户,要么允许第三方应用代表用户获得访问的权限.
同时为Web应用,桌面应用和手机,和起居室设备提供专门的认证流程.2012年10月,OAuth 2.0协议正式发布为RFC 6749.

## 1. Kong网关:术语

[Kong网关(一):service/route/consumer概念理解](/misc/kong-resource-description)

- `plugin`：一个在将请求代理到上游API之前或之后在Kong内部执行动作的插件.
- `Service`：代表外部上游 API或微服务的Kong实体.
- `upstream service`：这是指您位于Kong后面的自己的API/Service,客户端请求将转发到该API /Service.

## 2. Kong网关:安装OAuth2插件流程

### 2.1 添加一个测试Service

这个Service 是需要通过用过OAuth2 Token才能访问的服务. eg: 介入第三方Github登陆之后去要Github OAuth2 Token才能访问被授权的Github账号信息/repo信息.
创建一个叫作 `mock-service` url为`http://mockbin.org/request`的需要Oauth2 token 授权的服务.

```bash
curl -X POST \
  --url "http://127.0.0.1:8001/services" \
  --data "name=mock-service" \
  --data "url=http://mockbin.org/request"
```

#### 2.1.1 为这个服务增加route路由

这个路由`/mock` 类似于nginx server配置文件的的location

```bash
curl -X POST \
  --url "http://127.0.0.1:8001/services/mock-service/routes" \
  --data 'hosts[]=mockbin.org' \
  --data 'paths[]=/mock'
```

#### 2.1.2 测试这个API

```bash
curl -X GET \
  --url "http://127.0.0.1:8000/mock" \
  --header "Host: mockbin.org"
```

返回一个这个请求的全部信息

### 2.2 为这个服务开启OAuth2 Plugin

 ```bash
 curl -X POST \
   --url http://127.0.0.1:8001/services/mock-service/plugins/ \
   --data "name=oauth2" \
   --data "config.scopes=email, phone, address" \
   --data "config.mandatory_scope=true" \
   --data "config.enable_authorization_code=true"
 ```

response结果中包含 `provision_key `, `provision_key` 将被使用在web应用和Kong网关之前的API通讯,来确保通讯的安全.

```bash
{
    "service_id": "2c0c8c84-cd7c-40b7-c0b8-41202e5ee50b",
    "value": {
        "scopes": [
            "email",
            "phone",
            "address"
        ],
        "mandatory_scope": true,
        "provision_key": "2ef290c575cc46eec61947aa9f1e67d3",
        "hide_credentials": false,
        "enable_authorization_code": true,
        "token_expiration": 7200
    },
    "created_at": 1435783325000,
    "enabled": true,
    "name": "oauth2",
    "id": "656954bd-2130-428f-c25c-8ec47227dafa"
}
```

现在再次发送刚才定义的Route API, 发现它现在是受到保护的.

```bash
curl -X GET \
  --url "http://127.0.0.1:8000/mock" \
  --header "Host: mockbin.org"
```

### 2.3 创建消费者

类似于您在Github 中注册自己账号

```bash
curl -X GET \
  --url "http://127.0.0.1:8000/mock" \
  --header "Host: mockbin.org"
```

为您的开发者账号添加一个app

```
curl -X POST \
  --url "http://127.0.0.1:8001/consumers/thefosk/oauth2/" \
  --data "name=MojoTV" \
  --data "redirect_uris[]=https://mojotv.cn"
```

response 结果如下:

```json
{
    "consumer_id": "a0977612-bd8c-4c6f-ccea-24743112847f",
    "client_id": "318f98be1453427bc2937fceab9811bd",
    "id": "7ce2f90c-3ec5-4d93-cd62-3d42eb6f9b64",
    "name": "MojoTV",
    "created_at": 1435783376000,
    "redirect_uri": "https://mojotv.cn/",
    "client_secret": "efbc9e1f2bcc4968c988ef5b839dd5a4"
}
```

### 2.4 保存上面的环境变量

```go
const PROVISION_KEY="2ef290c575cc46eec61947aa9f1e67d3"
const KONG_ADMIN="http://127.0.0.1:8001"
const KONG_API="https://127.0.0.1:8443"
const API_PATH="/mock"
const SERVICE_HOST="mockbin.org"
const SCOPES=`{
    "email": "获取用户email权限",
    "address": "获取用户address权限",
    "phone": "获取用户phone权限"
}`
```

## 3. Golang 实现Kong 网关OAuth2 网关授权服务

按照官方node-express.js Demo实习 [https://github.com/Kong/kong-oauth2-hello-world](https://github.com/Kong/kong-oauth2-hello-world)

```go
package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"net/url"
	"strings"
)
import "net/http"

//第三方APP
//kong admin RESTful api 获取
const CLIENT_ID = "oInH5MY5H0IZVPT899zn2Fq0YLKmetsv"
const CLIENT_SECRET = "1EHqpI6MENOk8YfOEnYjd9hGrOhrPVEq"

//kong 服务配置
const PROVISION_KEY = "Y1TV0sKHqtIzZ4JHtI0x420o3PZwM6gD"
const KONG_ADMIN = "http://oauth2.mojotv.cn:8001"
const KONG_API = "https://oauth2.mojotv.cn:8443" //自定义ssl 证书 需要关闭ssl-check
const API_PATH = `/mock`
const SERVICE_HOST = "mockbin.org"

// oauth 服务器
const COOKIE_AUTH = "auth1"

var SCOPE_DESCRIPTIONS = map[string]string{
	"email":   "读取用户email权限",
	"address": "读取用户address权限",
	"phone":   "读取用户phone权限",
}

func RunAuthCenter() {
	// logger and recovery (crash-free) middleware
	router := gin.Default()
	router.Use(mwPanic)
	router.LoadHTMLGlob("templates/*")

	//显示前端登陆form页面
	router.GET("login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{
			"client_id":     c.Query("client_id"),
			"response_type": c.Query("response_type"),
			"scope":         c.Query("scope"),
		})
	})
	//自己用户名体系 身份验证
	router.POST("login", func(c *gin.Context) {
		user := c.PostForm("name")
		password := c.PostForm("password")
		clientId := c.PostForm("client_id")
		responseType := c.PostForm("response_type")
		scope := c.PostForm("authorize")

		//todo::数据库比对
		if user != "admin" || password != "admin" {
			//登陆失败
			c.SetCookie(COOKIE_AUTH, "", -1, "/", "", false, true)
			loginUri := fmt.Sprintf("login?client_id=%s&response_type=%s&scope=%s", clientId, responseType, url.QueryEscape(scope))
			c.Redirect(http.StatusMovedPermanently, loginUri)
			return
		}
		//登陆成功
		c.SetCookie(COOKIE_AUTH, "001", 36000000, "/", "", false, true)
		if clientId != "" {
			authorizationUri := fmt.Sprintf("authorize?client_id=%s&response_type=%s&scope=%s", clientId, responseType, url.QueryEscape(scope))
			c.Redirect(http.StatusMovedPermanently, authorizationUri)
			return
		}
		c.JSON(http.StatusOK, "login succeed")
	})

	//显示 OAuth2 用户授权页面 可以做出github 第三方网站登陆授权页面
	router.GET("authorize", func(c *gin.Context) {
		//todo:: html 中展示用户信息
		//todo:: html 中展示权限信息
		//todo:: 模仿对象 github.com 账号登陆  https://github.com/login/oauth/authorize?client_id=30d97f7383706665c5e0&scope=user%3Aemail
		clientId := c.Query("client_id")
		responseType := c.Query("response_type")
		scope := c.Query("scope")

		authedUserId, err := c.Cookie(COOKIE_AUTH)
		if err != nil {
			log.WithError(err).Error("auth cookie", COOKIE_AUTH)
			c.Request.URL.Path = "/login"
			router.HandleContext(c)
			return
		}

		if authedUserId == "" {
			log.WithError(err).Error("auth cookie empty")
			c.Request.URL.Path = "/login"
			router.HandleContext(c)
			return
		}

		appInfo, err := kongApiGetAppName(clientId)
		if err != nil {
			c.JSON(http.StatusOK, "client id is wrong")
			return
		}

		c.HTML(http.StatusOK, "authorization.html", gin.H{
			"client_id":          clientId,
			"response_type":      responseType,
			"scope":              scope,
			"application_name":   appInfo.Data[0].Name, //todo:: render more info to html template
			"SCOPE_DESCRIPTIONS": SCOPE_DESCRIPTIONS})
	})

	//OAuth2 用户授权页面 点击授权按钮, 获取从kong api consumer/app  redirect_url(包含authorization_code)
	//第三方 app 通过 authorization_code 调用kong OAuth2接口换取 token
	//使用token 访问service 的route 接口
	router.POST("authorize", func(c *gin.Context) {

		clientId := c.PostForm("client_id")
		responseType := c.PostForm("response_type")
		scope := c.PostForm("scope")

		authedUserId, err := c.Cookie(COOKIE_AUTH)
		if err != nil {
			log.WithError(err).Error("cookie", COOKIE_AUTH)
			c.JSON(http.StatusOK, "auth cookie 为空")
			return
		}

		redirectURL := KongApiPostAuthorization(clientId, responseType, scope, authedUserId)
		if redirectURL != "" {
			c.Redirect(http.StatusMovedPermanently, redirectURL)
			return
		}
		c.JSON(http.StatusOK, "没有被授权")

	})
	router.Run(":3000")
	// router.Run(":3000") for a hard coded port
}

func main() {
	RunAuthCenter()
}

type appInfo struct {
	Next interface{} `json:"next"`
	Data []struct {
		RedirectUris []string `json:"redirect_uris"`
		CreatedAt    int      `json:"created_at"`
		Consumer     struct {
			ID string `json:"id"`
		} `json:"consumer"`
		ID           string      `json:"id"`
		Tags         interface{} `json:"tags"`
		Name         string      `json:"name"`
		ClientSecret string      `json:"client_secret"`
		ClientID     string      `json:"client_id"`
	} `json:"data"`
}

func kongApiGetAppName(clientId string) (*appInfo, error) {
	resp, err := http.Get(KONG_ADMIN + "/oauth2?client_id=" + clientId)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data := &appInfo{}
	err = json.NewDecoder(resp.Body).Decode(data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func KongApiPostAuthorization(clientId, responseType, scope, authenticatedUserid string) string {
	// disable ssl check kong API 使用的是自己颁发的SSL 证书 post请求失败, 关闭httpClient的SSL证书校验
	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	payload := fmt.Sprintf(`{"client_id":"%s","response_type":"%s","scope":"%s","provision_key":"%s","authenticated_userid":"%s"}`, clientId, responseType, scope, PROVISION_KEY, authenticatedUserid)
	reader := strings.NewReader(payload)
	endpoint := KONG_API + API_PATH + "/oauth2/authorize"
	req, err := http.NewRequest("POST", endpoint, reader)
	if err != nil {
		log.WithError(err).Error("new request")
		return ""
	}
	req.Host = "mockbin.org"

	req.Header.Add("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithError(err).Error("do request")
		return ""
	}

	defer res.Body.Close()
	data := struct {
		RedirectURI string `json:"redirect_uri"`
	}{}
	err = json.NewDecoder(res.Body).Decode(&data)
	if err != nil {
		log.WithError(err).Error("json decode")
		return ""
	}
	return data.RedirectURI
}

func mwPanic(c *gin.Context) {
	defer func() {
		if err := recover(); err != nil {
			switch v := err.(type) {
			case error:
				log.WithError(v).Error("gin handle all error")
				c.AbortWithStatusJSON(http.StatusOK, gin.H{"code": http.StatusNoContent, "msg": v.Error()})
				//todo:: 细分更多的panic
			default:
				log.Error(v)
			}
		}
	}()
	c.Next()
}

func handlerError(err error) {
	if err != nil {
		panic(err)
	}
}

```

***Jekyll 模板语法冲突 请在Golang中把 \{\{ \}\} 斜线剔除***

golang login.html 模板

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登陆页面</title>
</head>
<body>


<h2>欢迎登陆</h2>
<form method="post" action="login">
    <input type="hidden" name="client_id" value="\{\{.client_id\}\}">
    <input type="hidden" name="response_type" value="\{\{.response_type\}\}">
    <input type="hidden" name="scope" value="\{\{.scope\}\}">
    <p>姓名：<input type="text" name="name" size="10"></p>
    <p>密码：<input type="password" name="password" size="10"></p>
    <p><input type="submit" value="登陆">
        <input type="reset" value="取消"></p>
</form>

</body>
</html> 

```

golang authorization.html OAuth2授权页面模板

```html

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>登陆页面</title>
</head>
<body>

<h2>Oauth2 Authorization</h2>
<h3>\{\{.application_name\}\}</h3>
<p>
\{\{range $key,$value := .SCOPE_DESCRIPTIONS\}\}<li>\{\{ $key \}\} -- \{\{ $value\}\}</li>\{\{else\}\}<div><strong>没有数据</strong></div>\{\{end\}\}
</p>

<form method="post" action="authorize">
    <input type="hidden" name="client_id" value="\{\{.client_id\}\}">
    <input type="hidden" name="response_type" value="\{\{.response_type\}\}">
    <input type="hidden" name="scope" value="\{\{.scope\}\}">
<p><input type="submit" value="授权">
<input type="reset" value="取消"></p>
</form>

</body>
</html>

```

## 4. 测试Kong OAuth2 服务

### 4.1 OAuth2授权页面

`http://127.0.0.1:3000/authorize?response_type=code&scope=email%20address&client_id={$client_id}`

### 4.2 Authorize

点击收取按之前必须用户已经登陆,

![](/assets/image/kong_oauth2_authorize.png)

点击 授权按钮之后 301重定向到 `https://mojotv.cn/?code=8Yy4LZHxsNZ9fObqoQ8D6or6MRT4Ui64`

### 4.3 第三方APP通过code 换取token

```bash
curl -X POST \
  --url "https://127.0.0.1:8443/mock/oauth2/token" \
  --header "Host: mockbin.org" \
  --data "grant_type=authorization_code" \
  --data "client_id=318f98be1453427bc2937fceab9811bd" \
  --data "client_secret=efbc9e1f2bcc4968c988ef5b839dd5a4" \
  --data "redirect_uri=https://mojotv.com/" \
  --data "code=8Yy4LZHxsNZ9fObqoQ8D6or6MRT4Ui64" \
  --insecure
```

Response 结果:

```json
{
    "refresh_token": "N8YXZFNtx0onuuR7v465nVmnFN7vBKWk",
    "token_type": "bearer",
    "access_token": "njVmea9rlSbSUtZ2wDlHf62R7QKDgDhG",
    "expires_in": 7200
}
```

### 4.4 使用Token访问API

```bash
curl -X GET \
  --url "http://127.0.0.1:8000/mock" \
  --header "Host: mockbin.org" \
  --header "Authorization: bearer njVmea9rlSbSUtZ2wDlHf62R7QKDgDhG"
```

注意 Kong API 检验Token正确,就会转发额外的Header到后端业务服务器

```
...
"x-consumer-id": "77e3f7ca-a969-48bb-a6d0-4a104ea7ad1e",
"x-consumer-username": "thefosk",
"x-authenticated-scope": "email address",
...
```
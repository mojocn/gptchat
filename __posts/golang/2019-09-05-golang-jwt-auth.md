---
layout: post
title: Go进阶24:Go JWT RESTful身份认证教程
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,Go语言RESTful-JWT身份认证教程
description:  Go语言教程,Golang教程,Go语言RESTful-JWT身份认证教程,JWT是一个非常轻巧的规范,这个规范允许我们使用JWT在用户和服务器之间传递安全可靠的信息
permalink: /go/:title
coverage: golang_jwt.png
date: 2019-09-05T23:20:54+08:00
---

## 1.什么是JWT

JWT（JSON Web Token）是一个非常轻巧的规范,这个规范允许我们使用JWT在用户和服务器之间传递安全可靠的信息,
一个JWT由三部分组成,***Header头部,Claims载荷,Signature签名***,

JWT原理类似我们加盖公章或手写签名的的过程,合同上写了很多条款,
不是随便一张纸随便写啥都可以的,必须要一些证明,比如签名,
比如盖章,JWT就是通过附加签名,保证传输过来的信息是真的,而不是伪造的,

它将用户信息加密到token里,服务器不保存任何用户信息,服务器通过使用保存的密钥验证token的正确性,只要正确即通过验证,

## 2.JWT构成

一个JWT由三部分组成,***Header头部,Claims载荷,Signature签名***,

- Header头部：头部,表明类型和加密算法
- Claims载荷：声明,即载荷（承载的内容）
- Signature签名：签名,这一部分是将header和claims进行base64转码后,并用header中声明的加密算法加盐(secret)后构成,即：

```javascript
let tmpstr = base64(header)+base64(claims)
let signature = encrypt(tmpstr,secret)
//最后三者用"."连接,即：
let token = base64(header)+"."+base64(claims)+"."+signature
```

## 3.javascript提取JWT字符串荷载信息

JWT里面payload可以包含很多字段,字段越多您的token字符串就越长.
您的HTTP请求通讯的发送的数据就越多,回到之接口响应时间等待稍稍的变长一点点.

一下代码就是前端javascript从payload获取登录的用户信息.
当然后端middleware也可以直接解析payload获取用户信息,减少到数据库中查询user表数据.接口速度会更快,数据库压力更小.
后端检查JWT身份验证时候当然会校验payload和Signature签名是否合法.

```javascript
let tokenString = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1Njc3Nzc5NjIsImp0aSI6IjUiLCJpYXQiOjE1Njc2OTE1NjIsImlzcyI6ImZlbGl4Lm1vam90di5jbiIsImlkIjo1LCJjcmVhdGVkX2F0IjoiMjAxOS0wOS0wNVQxMTo1Njo1OS41NjI1NDcwODYrMDg6MDAiLCJ1cGRhdGVkX2F0IjoiMjAxOS0wOS0wNVQxNjo1ODoyMC41NTYxNjAwOTIrMDg6MDAiLCJ1c2VybmFtZSI6ImVyaWMiLCJuaWNrX25hbWUiOiIiLCJlbWFpbCI6IjEyMzQ1NkBxcS5jb20iLCJtb2JpbGUiOiIiLCJyb2xlX2lkIjo4LCJzdGF0dXMiOjAsImF2YXRhciI6Ii8vdGVjaC5tb2pvdHYuY24vYXNzZXRzL2ltYWdlL2F2YXRhcl8zLnBuZyIsInJlbWFyayI6IiIsImZyaWVuZF9pZHMiOm51bGwsImthcm1hIjowLCJjb21tZW50X2lkcyI6bnVsbH0.tGjukvuE9JVjzDa42iGfh_5jIembO5YZBZDqLnaG6KQ'
function parseTokenGetUser(jwtTokenString) {
    let base64Url = jwtTokenString.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    let user = JSON.parse(jsonPayload);

    localStorage.setItem("token", jwtTokenString);
    localStorage.setItem("expire_ts", user.exp);
    localStorage.setItem("user", jsonPayload);
    return user;
}
parseTokenGetUser(tokenString)
```

复制上面javascript代码到浏览器console中执行就可以解析出用户信息了! 当然您要可以使用在线工具来解析jwt token的payload荷载
[JWT在线解析工具](https://jwt.io/)

## 4. go语言Gin框架实现JWT用户认证

接下来我将使用最受欢迎的[gin-gonic/gin](https://github.com/gin-gonic/gin) 和 [dgrijalva/jwt-go](github.com/dgrijalva/jwt-go)
这两个package来演示怎么使用JWT身份认证.

### 4.1 登录接口

#### 4.1.1 登录接口路由(login-route)

[https://github.com/libragen/felix/blob/master/ssh2ws/ssh2ws.go](https://github.com/libragen/felix/blob/master/ssh2ws/ssh2ws.go)

```go
	r := gin.New()
	r.MaxMultipartMemory = 32 << 20
	//sever static file in http's root path
	binStaticMiddleware, err := felixbin.NewGinStaticBinMiddleware("/")
	if err != nil {
		return err
	}
    //支持跨域
	mwCORS := cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"PUT", "PATCH", "POST", "GET", "DELETE"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Type"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		MaxAge: 2400 * time.Hour,
	})
	r.Use(binStaticMiddleware, mwCORS)


	{
		r.POST("comment-login", internal.LoginCommenter)       //评论用户登陆
		r.POST("comment-register", internal.RegisterCommenter) //评论用户注册
	}

	api := r.Group("api")
    api.POST("admin-login", internal.LoginAdmin) //管理后台登陆
```

`internal.LoginCommenter` 和 `internal.LoginAdmin` 这两个方法是一样的,
只需要关注其中一个就可以了,我们就关注`internal.LoginCommenter`

#### 4.1.2 登录login handler

编写登录的handler

[https://github.com/libragen/felix/blob/master/ssh2ws/internal/h_login.go](https://github.com/libragen/felix/blob/master/ssh2ws/internal/h_login.go)

```go
func LoginCommenter(c *gin.Context) {
	var mdl model.User
	err := c.ShouldBind(&mdl)
	if handleError(c, err) {
		return
	}
	//获取ip
	ip := c.ClientIP()
	//roleId 8 是评论系统的用户
	data, err := mdl.Login(ip, 8)
	if handleError(c, err) {
		return
	}
	jsonData(c, data)
}
```

其中最关键的是`mdl.Login(ip, 8)`这个函数
[https://github.com/libragen/felix/blob/master/model/m_users.go](https://github.com/libragen/felix/blob/master/model/m_users.go)

- 1.数据库查询用户
- 2.校验用户role_id
- 3.比对密码
- 4.防止密码泄露(清空struct的属性)
- 5.生成JWT-string

```go
//Login
func (m *User) Login(ip string, roleId uint) (string, error) {
	m.Id = 0
	if m.Password == "" {
		return "", errors.New("password is required")
	}
	inputPassword := m.Password
    //获取登录的用户
	err := db.Where("username = ? or email = ?", m.Username, m.Username).First(&m).Error
	if err != nil {
		return "", err
	}
	//校验用户角色
	if (m.RoleId & roleId) != roleId {
		return "", fmt.Errorf("not role of %d", roleId)
	}
	//验证密码
	//password is set to bcrypt check
	if err := bcrypt.CompareHashAndPassword([]byte(m.HashedPassword), []byte(inputPassword)); err != nil {
		return "", err
	}
	//防止密码泄露
	m.Password = ""
	//生成jwt-string
	return jwtGenerateToken(m, time.Hour*24*365)
}

```

#### 4.1.2 生成JWT-string(核心代码)

- 1.自定义payload结构体,不建议直接使用 dgrijalva/jwt-go `jwt.StandardClaims`结构体.因为他的payload包含的用户信息太少.
- 2.实现 `type Claims interface` 的 `Valid() error` 方法,自定义校验内容
- 3.生成JWT-string `jwtGenerateToken(m *User,d time.Duration) (string, error)`

[https://github.com/libragen/felix/blob/master/model/m_jwt.go](https://github.com/libragen/felix/blob/master/model/m_jwt.go)

```go
package model

import (
	"errors"
	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/sirupsen/logrus"
)

var AppSecret = ""//viper.GetString会设置这个值(32byte长度)
var AppIss = "github.com/libragen/felix"//这个值会被viper.GetString重写

//自定义payload结构体,不建议直接使用 dgrijalva/jwt-go `jwt.StandardClaims`结构体.因为他的payload包含的用户信息太少.
type userStdClaims struct {
	jwt.StandardClaims
	*User
}
//实现 `type Claims interface` 的 `Valid() error` 方法,自定义校验内容
func (c userStdClaims) Valid() (err error) {
	if c.VerifyExpiresAt(time.Now().Unix(), true) == false {
		return  errors.New("token is expired")
	}
	if !c.VerifyIssuer(AppIss, true) {
		return  errors.New("token's issuer is wrong")
	}
	if c.User.Id < 1 {
		return errors.New("invalid user in jwt")
	}
	return
}

func jwtGenerateToken(m *User,d time.Duration) (string, error) {
	m.Password = ""
	expireTime := time.Now().Add(d)
	stdClaims := jwt.StandardClaims{
		ExpiresAt: expireTime.Unix(),
		IssuedAt:  time.Now().Unix(),
		Id:        fmt.Sprintf("%d", m.Id),
		Issuer:    AppIss,
	}

	uClaims := userStdClaims{
		StandardClaims: stdClaims,
		User:           m,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, uClaims)
	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString([]byte(AppSecret))
	if err != nil {
		logrus.WithError(err).Fatal("config is wrong, can not generate jwt")
	}
	return tokenString, err
}


//JwtParseUser 解析payload的内容,得到用户信息
//gin-middleware 会使用这个方法
func JwtParseUser(tokenString string) (*User, error) {
	if tokenString == "" {
		return nil, errors.New("no token is found in Authorization Bearer")
	}
	claims := userStdClaims{}
	_, err := jwt.ParseWithClaims(tokenString, &claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(AppSecret), nil
	})
	if err != nil {
		return nil, err
	}
	return claims.User, err
}

```

### 4.2 JWT中间件(middleware)

- 1.从url-query的`_t`获取JWT-string或者从请求头 Authorization中获取JWT-string
- 2.`model.JwtParseUser(token)`解析JWT-string获取User结构体(减少中间件查询数据库的操作和时间)
- 3.设置用户信息到`gin.Context` 其他的handler通过gin.Context.Get(contextKeyUserObj),在进行用户Type Assert得到model.User 结构体.
- 4.使用了jwt-middle之后的handle从gin.Context中获取用户信息

[https://github.com/libragen/felix/blob/master/ssh2ws/internal/mw_jwt.go](https://github.com/libragen/felix/blob/master/ssh2ws/internal/mw_jwt.go)

```go
package internal

import (
	"net/http"
	"strings"

	"github.com/libragen/felix/model"
	"github.com/gin-gonic/gin"
)

const contextKeyUserObj = "authedUserObj"
const bearerLength = len("Bearer ")

func ctxTokenToUser(c *gin.Context, roleId uint) {
	token, ok := c.GetQuery("_t")
	if !ok {
		hToken := c.GetHeader("Authorization")
		if len(hToken) < bearerLength {
			c.AbortWithStatusJSON(http.StatusPreconditionFailed, gin.H{"msg": "header Authorization has not Bearer token"})
			return
		}
		token = strings.TrimSpace(hToken[bearerLength:])
	}
	usr, err := model.JwtParseUser(token)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusPreconditionFailed, gin.H{"msg": err.Error()})
		return
	}
	if (usr.RoleId & roleId) != roleId {
		c.AbortWithStatusJSON(http.StatusPreconditionFailed, gin.H{"msg": "roleId 没有权限"})
		return
	}

	//store the user Model in the context
	c.Set(contextKeyUserObj, *usr)
	c.Next()
	// after request
}

func MwUserAdmin(c *gin.Context) {
	ctxTokenToUser(c, 2)
}

func MwUserComment(c *gin.Context) {
	ctxTokenToUser(c, 8)
}

```

使用了jwt-middle之后的handle从gin.Context中获取用户信息,
[https://github.com/libragen/felix/blob/master/ssh2ws/internal/helper.go](https://github.com/libragen/felix/blob/master/ssh2ws/internal/helper.go)

```go
func mWuserId(c *gin.Context) (uint, error) {
	v,exist := c.Get(contextKeyUserObj)
	if !exist {
		return 0,errors.New(contextKeyUserObj + " not exist")
	}
	user, ok := v.(model.User)
	if ok {
		return user.Id, nil
	}
	return 0,errors.New("can't convert to user struct")
}
```

### 4.2 使用JWT中间件

一下代码有两个JWT中间件的用法

- `internal.MwUserAdmin` 管理后台用户中间件
- `internal.MwUserCommenter` 评论用户中间件

[https://github.com/libragen/felix/blob/master/ssh2ws/ssh2ws.go](https://github.com/libragen/felix/blob/master/ssh2ws/ssh2ws.go)

```go
package ssh2ws

import (
	"time"

	"github.com/libragen/felix/felixbin"
	"github.com/libragen/felix/model"
	"github.com/libragen/felix/ssh2ws/internal"
	"github.com/libragen/felix/wslog"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func RunSsh2ws(bindAddress, user, password, secret string, expire time.Duration, verbose bool) error {
	err := model.CreateGodUser(user, password)
	if err != nil {
		return err
	}
	//config jwt variables
	model.AppSecret = secret
	model.ExpireTime = expire
	model.AppIss = "felix.mojotv.cn"
	if !verbose {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.MaxMultipartMemory = 32 << 20
	//sever static file in http's root path
	binStaticMiddleware, err := felixbin.NewGinStaticBinMiddleware("/")
	if err != nil {
		return err
	}

	mwCORS := cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"PUT", "PATCH", "POST", "GET", "DELETE"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Type"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		MaxAge: 2400 * time.Hour,
	})
	r.Use(binStaticMiddleware, mwCORS)


	{
		r.POST("comment-login", internal.LoginCommenter)       //评论用户登陆
		r.POST("comment-register", internal.RegisterCommenter) //评论用户注册
	}

	api := r.Group("api")
	api.POST("admin-login", internal.LoginAdmin) //管理后台登陆
	api.GET("meta", internal.Meta)

	//terminal log
	hub := wslog.NewHub()
	go hub.Run()

	{
		//websocket
		r.GET("ws/hook", internal.MwUserAdmin, internal.Wslog(hub))
		r.GET("ws/ssh/:id", internal.MwUserAdmin, internal.WsSsh)
	}
	//给外部调用
	{
		api.POST("wslog/hook-api", internal.JwtMiddlewareWslog, internal.WsLogHookApi(hub))
		api.GET("wslog/hook", internal.MwUserAdmin, internal.WslogHookAll)
		api.POST("wslog/hook", internal.MwUserAdmin, internal.WslogHookCreate)
		api.PATCH("wslog/hook", internal.MwUserAdmin, internal.WslogHookUpdate)
		api.DELETE("wslog/hook/:id", internal.MwUserAdmin, internal.WslogHookDelete)

		api.GET("wslog/msg", internal.MwUserAdmin, internal.WslogMsgAll)
		api.POST("wslog/msg-rm", internal.MwUserAdmin, internal.WslogMsgDelete)
	}

	//评论
	{
		api.GET("comment", internal.CommentAll)
		api.GET("comment/:id/:action", internal.MwUserComment, internal.CommentAction)
		api.POST("comment", internal.MwUserComment, internal.CommentCreate)
		api.DELETE("comment/:id", internal.MwUserAdmin, internal.CommentDelete)
	}
	{
		api.GET("hacknews",internal.MwUserAdmin, internal.HackNewAll)
		api.PATCH("hacknews", internal.HackNewUpdate)
		api.POST("hacknews-rm", internal.HackNewRm)
	}

	authG := api.Use(internal.MwUserAdmin)
	{

		//create wslog hook

		authG.GET("ssh", internal.SshAll)
		authG.POST("ssh", internal.SshCreate)
		authG.GET("ssh/:id", internal.SshOne)
		authG.PATCH("ssh", internal.SshUpdate)
		authG.DELETE("ssh/:id", internal.SshDelete)

		authG.GET("sftp/:id", internal.SftpLs)
		authG.GET("sftp/:id/dl", internal.SftpDl)
		authG.GET("sftp/:id/cat", internal.SftpCat)
		authG.GET("sftp/:id/rm", internal.SftpRm)
		authG.GET("sftp/:id/rename", internal.SftpRename)
		authG.GET("sftp/:id/mkdir", internal.SftpMkdir)
		authG.POST("sftp/:id/up", internal.SftpUp)

		authG.POST("ginbro/gen", internal.GinbroGen)
		authG.POST("ginbro/db", internal.GinbroDb)
		authG.GET("ginbro/dl", internal.GinbroDownload)

		authG.GET("ssh-log", internal.SshLogAll)
		authG.DELETE("ssh-log/:id", internal.SshLogDelete)
		authG.PATCH("ssh-log", internal.SshLogUpdate)

		authG.GET("user", internal.UserAll)
		authG.POST("user", internal.RegisterCommenter)
		//api.GET("user/:id", internal.SshAll)
		authG.DELETE("user/:id", internal.UserDelete)
		authG.PATCH("user", internal.UserUpdate)

	}

	if err := r.Run(bindAddress); err != nil {
		return err
	}
	return nil
}
```

## 5. Cookie-Session VS JWT

JWT和session有所不同,session需要在服务器端生成,服务器保存session,只返回给客户端sessionid,客户端下次请求时带上sessionid即可,因为session是储存在服务器中,有多台服务器时会出现一些麻烦,需要同步多台主机的信息,不然会出现在请求A服务器时能获取信息,但是请求B服务器身份信息无法通过,JWT能很好的解决这个问题,服务器端不用保存jwt,只需要保存加密用的secret,在用户登录时将jwt加密生成并发送给客户端,由客户端存储,以后客户端的请求带上,由服务器解析jwt并验证,这样服务器不用浪费空间去存储登录信息,不用浪费时间去做同步,

### 5.1 什么是cookie

基于cookie的身份验证是有状态的,这意味着验证的记录或者会话(session)必须同时保存在服务器端和客户端,服务器端需要跟踪记录session并存至数据库,
同时前端需要在cookie中保存一个sessionID,作为session的唯一标识符,可看做是session的“身份证”,

cookie,简而言之就是在客户端（浏览器等）保存一些用户操作的历史信息（当然包括登录信息）,并在用户再次访问该站点时浏览器通过HTTP协议将本地cookie内容发送给服务器,从而完成验证,或继续上一步操作,

![](/assets/image/jwt_cookie.webp)

### 5.2 什么是session

session,会话,简而言之就是在服务器上保存用户操作的历史信息,在用户登录后,服务器存储用户会话的相关信息,并为客户端指定一个访问凭证,如果有客户端凭此凭证发出请求,则在服务端存储的信息中,取出用户相关登录信息,
并且使用服务端返回的凭证常存储于Cookie中,也可以改写URL,将id放在url中,这个访问凭证一般来说就是SessionID,

![](/assets/image/jwt_session.webp)

### 5.3 cookie-session身份验证机制的流程

session和cookie的目的相同,都是为了克服http协议无状态的缺陷,但完成的方法不同,
session可以通过cookie来完成,在客户端保存session id,而将用户的其他会话消息保存在服务端的session对象中,与此相对的,cookie需要将所有信息都保存在客户端,
因此cookie存在着一定的安全隐患,例如本地cookie中保存的用户名密码被破译,或cookie被其他网站收集（例如：1. appA主动设置域B cookie,让域B cookie获取;2.
XSS,在appA上通过javascript获取document.cookie,并传递给自己的appB）,

1. 用户输入登录信息
2. 服务器验证登录信息是否正确,如果正确就创建一个session,并把session存入数据库
3. 服务器端会向客户端返回带有sessionID的cookie
4. 在接下来的请求中,服务器将把sessionID与数据库中的相匹配,如果有效则处理该请求
5. 如果用户登出app,session会在客户端和服务器端都被销毁

### 5.4 Cookie-session 和 JWT 使用场景

#### 后端渲染HTML页面建议使用Cookie-session认证

后按渲染页面可以很方便的写入/清除cookie到浏览器,权限控制非常方便.很少需要要考虑跨域AJAX认证的问题.

#### App,web单页面应用,APIs建议使用JWT认证

App,web APIs等的兴起,基于token的身份验证开始流行,
当我们谈到利用token进行认证,我们一般说的就是利用JSON Web Tokens（JWTs）进行认证,虽然有不同的方式来实现token,
事实上,JWTs 已成为标准,因此在本文中将互换token与JWTs,


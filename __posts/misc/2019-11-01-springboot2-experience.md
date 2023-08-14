---
layout: post
title: "MISC:SpringBoot2-JPA-JWT-RESTful服务端编程心得"
category: Misc
tags: Java
keywords: "Java,SpringBoot,JWT,JPA,RESTful"
description: "springboot2 JWT JPA RESTful Boilerplate 样板项目"
coverage: springBoot.png
permalink: /misc/:title
date: 2019-11-01T15:07:45+08:00
---

## 1. 背景

好长时间没有写技术博客了, 因为最佳忙着使用SpringBoot2 写一个RESTful的Server.
因为之前大部分时候都是写Golang/Python-Flask代码.

一起开会的过程中让我对架构师 这个职位有新的认识. 有拿的出手的开源项目的架构师才是货真价实的架构师.
拿设计模式/解耦/高可用/可扩展等专业名词和概念唬上级和开发次之.

废话不多说了. show me the code: 下面我这几天从零搭建的 SpringBoot2 JWT JPA RESTful 的上手样板项目,
这也是我的第一个Springboot RESTful API 项目. 很多不足指出请各位大佬指点.

### 1.1 SpringBoot 初见

1. 感觉Laravel的依赖注入和AOP 编程思想致敬java spring 框架
2. swoole-Swoft框架的注解模式致敬Springboot 的注解

## 2. 目录结构

项目[github.com/mojocn/springboot2app](https://github.com/mojocn/springboot2app)

1. `src/main/java/springboot2app/common` 放置一些工具和杂项class
1. `src/main/java/springboot2app/config` springboot-security 配置权限相关
1. `src/main/java/springboot2app/controller` RESTful 控制器和路由注解
1. `src/main/java/springboot2app/domian` MongoDB 模型class
1. `src/main/java/springboot2app/entity` MySQL JPA Entity Class
1. `src/main/java/springboot2app/request` Json Request 参数序列化和校验class
1. `src/main/java/springboot2app/repository` 数据库持久层
1. `src/main/java/springboot2app/service` 业务逻辑层

```go
D:\CODE\SPRINGBOO2APP
├─src
│  ├─main
│  │  ├─java
│  │  │  └─springboot2app
│  │  │      ├─common
│  │  │      │  ├─annotation  // 自定义@Menu 注解,用作API权限控制
│  │  │      │  ├─auth        // 用户登陆和JWT认证县官
│  │  │      │  ├─error       // 自定义Exception 和 统一的Exception 异常处理
│  │  │      │  └─util        // 工具类和帮助方法
│  │  │      ├─config
│  │  │      ├─controller
│  │  │      ├─domain
│  │  │      ├─entity
│  │  │      ├─repository
│  │  │      ├─request
│  │  │      └─service
│  │  └─resources
│  └─test
│      └─java
│          └─hello  // SpringBoot 单元测试类
```

## 3. 技术细节

***这是一个Springboot + JPA + JWT 初学者样板项目 Boilerplate***  [github.com/mojocn/springboot2app](https://github.com/mojocn/springboot2app)

### 3.1 依赖

- springboot 2.1.6
- springboot JPA
- springboot MySQL
- springBoot Security
- spirnbBoot MongoDB

### 3.2 数据库

- MySQL(没有使用JSON字段特性) (springboo2app 会自动更具entity 自动创建数据库)
- MongoDB(引入 未使用到业务逻辑)

### 3.3 功能(初学者可以借鉴的共)

1. API 级别的权限控制
2. JPA 分页接口封装
3. JPA count 字段(sql: left join group count) 获取
4. 获取自定义@Menu注解做权限控制
5. JPA repository @Query 写SQL语句
6. SpringBoot2 登陆及JWT认证

## 3. Java-SpringBoot vs Golang

Java/Springboot 缺点:

1. 语法糖太少, 语法比较啰嗦
2. 面向切面编程/依赖注入/注解/ 对于初学者比较难理解, 给代码的数据逻辑流程带来极大的不便
3. 关于JAVA的性能,个人感觉性能没有多强大
4. JAVA在性能和编程的快捷和容易性方面不如Golang
5. Springboot的组件网上的教程代码都大坨大坨的, 想偷懒快捷的学习教程是不现实的
6. JPA作为ORM 远远没有其他语言ORM快捷和简便

Java/Springboot 优点:

1. 网上可以搜索到大量内容重复的教程
2. 依赖注入减少了写new 和 单例的次数

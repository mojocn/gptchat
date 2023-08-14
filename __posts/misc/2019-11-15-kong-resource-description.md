---
layout: post
title: "Kong网关(一):service/route/consumer概念理解"
category: Misc
tags: Gateway 网关
keywords: "kong 网关 service 服务 route 路由 consumer 消费者 概念解释"
description: "kong 网关 service 服务 route 路由 consumer 消费者 概念解释"
coverage: kong.png
permalink: /misc/:title
date: 2019-11-15T15:53:45+08:00
---

Kong是一个在Nginx运行的Lua应用程序,由lua-nginx-module实现.Kong和OpenResty一起打包发行,其中已经包含了lua-nginx-module.OpenResty不是Nginx的分支,而是一组扩展其功能的模块.

您可以通过增加更多 Kong Server 机器对 Kong 服务进行水平扩展,通过前置的负载均衡器向这些机器分发请求.根据文档描述,两个Cassandra节点就足以支撑绝大多数情况,但如果网络非常拥挤,可以考虑适当增加更多节点.

对于开源社区来说,Kong 中最诱人的一个特性是可以通过插件扩展已有功能,这些插件在 API 请求响应循环的生命周期中被执行.插件使用 Lua 编写,而且Kong还有如下几个基础功能：HTTP 基本认证,密钥认证,CORS（
Cross-origin Resource Sharing,跨域资源共享）,TCP,UDP,文件日志,API 请求限流,请求转发以及 nginx 监控.

Kong 是在客户端和（微）服务间转发API通信的API网关,通过插件扩展功能.Kong 有两个主要组件：

1. Kong Server ：基于nginx的服务器,用来接收 API 请求.
2. Apache Cassandra：用来存储操作数据.

## 1. services 服务

> Service entities, as the name implies,
> are abstractions of each of your own upstream services.
> Examples of Services would be a data transformation microservice, a billing API, etc.

Service 顾名思义,就是我们自己定义的上游服务,通过Kong匹配到相应的请求要转发的地方,
Service 可以与下面的Route进行关联,一个Service可以有很多Route,匹配到的Route就会转发到Service中,
当然中间也会通过Plugin的处理,增加或者减少一些相应的Header或者其他信息.

1. Service服务,通过Kong匹配到相应的请求要转发的地方(eg: 理解nginx 配置文件中server)

## 2. Routes 路由

> Route entities define rules to match client requests.
> Each Route is associated with a Service,
> and a Service may have multiple Routes associated to it.
> Every request matching a given Route will be proxied to its associated Service.

> The combination of Routes and Services (and the separation of concerns between them)
> offers a powerful routing mechanism with which it is possible to
> define fine-grained entry-points in Kong
> leading to different upstream services of your infrastructure.

***Route 路由相当于nginx 配置中的location***

Route实体定义匹配客户端请求的规则.
每个路由都与一个服务相关联,而服务可能有多个与之相关联的路由.
每一个匹配给定路线的请求都将被提交给它的相关服务.

路由和服务的组合（以及它们之间的关注点分离）提供了一种强大的路由机制,
可以在Kong中定义细粒度的入口点,从而引导您的访问到不同upstream服务.

## 3. Consumers 消费者

> The Consumer object represents a consumer - or a user - of a Service.
> You can either rely on Kong as the primary datastore,
> or you can map the consumer list with your database to keep consistency between Kong and your existing primary datastore.

最简单的理解和配置consumer的方式是,将其于用户进行一一映射,即一个consumer代表一个用户（或应用）.但是对于KONG而言,这些都无所谓.
Consumer的核心原则是您可以为其添加插件,从而自定义他的请求行为.
所以,或许您会有一个手机APP应用,并为他的每个版本都定义一个consumer,
又或者您有一个应用或几个应用,并为这些应用定义统一个consumer,这些都无所谓.

1. Consumer是使用Service的用户(eg: github账号就是一个Consumer是使用github Open API Service)
2. ***Consumer的核心原则是您可以为其添加Plugin插件***,从而自定义他的请求行为.(eg: 安装kong Oauth2插件)
3. Consumer下可以创建多个APP(eg:您的github账号中您可以创建多个[Github Apps](https://github.com/settings/apps/new) )

## 4. Kong Centos7 安装

```bash
# 下载kong rpm 的安装包
wget https://bintray.com/kong/kong-rpm/download_file?file_path=centos/7/kong-1.4.0.el7.amd64.rpm -O kong-1.4.0.el7.amd64.rpm
sudo yum install epel-release

# 安装下载好的kong rpm 安装文件
sudo yum install kong-1.4.0.*.rpm --nogpgcheck

# 复制默认kong 配置文件
cp /etc/kong/kong.conf.default /etc/kong/kong.conf
# run kong
kong

```

## 5. Kong Docker 安装

```bash
# 创建docker network
docker network create kong-net

# 安装pg9.6
docker run -d --name kong-database \
               --network=kong-net \
               -p 5432:5432 \
               -e "POSTGRES_USER=kong" \
               -e "POSTGRES_DB=kong" \
               postgres:9.6

# 数据库迁移
docker run --rm \
     --network=kong-net \
     -e "KONG_DATABASE=postgres" \
     -e "KONG_PG_HOST=kong-database" \
     -e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
     kong:1.4.0 kong migrations bootstrap
# 运行kong 镜像
docker run -d --name kong \
     --network=kong-net \
     -e "KONG_DATABASE=postgres" \
     -e "KONG_PG_HOST=kong-database" \
     -e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
     -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
     -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
     -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
     -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
     -e "KONG_ADMIN_LISTEN=0.0.0.0:8001, 0.0.0.0:8444 ssl" \
     -p 8000:8000 \
     -p 8443:8443 \
     -p 8001:8001 \
     -p 8444:8444 \
     kong:1.4.0

# 测试 kong管理API
curl -i http://localhost:8001/
```
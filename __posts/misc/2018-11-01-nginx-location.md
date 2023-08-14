---
layout: post
title: nginx配置之location
category: Misc
tags: Nginx
keywords: Nginx location settings
date: 2018-12-26T13:19:54+08:00
---

## location的作用

location指令的作用是根据用户请求URI来执行不同的应用,location会根据用户请求网站URL进行匹配定位到某个location区块. 如果匹配成功将会处理location块的规则.

## location的语法规则如下

    location  =     /uri
       ┬      ┬       ┬
       │      │       │
       │      │       │
       │      │       │
       │      │       │
       │      │       └─────────────── 前缀|正则
       │      └──────────────────── 可选的修饰符（用于匹配模式及优先级）
       └───────────────────────── 必须

## 修饰符说明及优先级顺序

优先级表示优先匹配,可理解为编程当中的switch语法.

以下从上到下,第一个优先级最高.

    =      |   location = /uri
    ^~     |   location ^~ /uri
    ~      |   location ~ pattern
    ~*     |   location ~* pattern
    /uri   |   location /uri
    @      |   location @err

**1,** = ,精确匹配,表示严格相等

    location = /static {
      default_type text/html;
      return 200 "hello world";
    }

    # http://localhost/static   [成功]
    # http://localhost/Static   [失败]

**2,** ^~ ,匹配以URI开头

    location ^~ /static {
      default_type text/html;
      return 200 "hello world";
    }

    # http://localhost/static/1.txt    [成功]
    # http://localhost/public/1.txt    [失败]

**3,** ~ ,对大小写敏感, 使用正则 注意：某些操作系统对大小写敏感是不生效的,比如windows操作系统

    location ~ ^/static$ {
      default_type text/html;
      return 200 "hello world";
    }

    # http://localhost/static         [成功]
    # http://localhost/static?v=1     [成功] 忽略查询字符串
    # http://localhost/STATic         [失败]
    # http://localhost/static/        [失败] 多了斜杠

**4,** ~* ,与~相反,忽略大小写敏感, 使用正则

    location ~* ^/static$ {
      default_type text/html;
      return 200 "hello world";
    }

    # http://localhost/static         [成功]
    # http://localhost/static?v=1     [成功] 忽略查询字符串
    # http://localhost/STATic         [成功]
    # http://localhost/static/        [失败] 多了斜杠

**5,** /uri ,匹配以/uri开头的地址

    location  /static {
      default_type text/html;
      return 200 "hello world";
    }

    # http://localhost/static              [成功]
    # http://localhost/STATIC?v=1          [成功]
    # http://localhost/static/1            [成功]
    # http://localhost/static/1.txt        [成功]

**6,** @ 用于定义一个 Location 块,且该块不能被外部 Client 所访问,只能被nginx内部配置指令所访问,比如 try_files or error_page

    location  / {
      root   /root/;
      error_page 404 @err;
    }
    location  @err {
      # 规则
      default_type text/html;
      return 200 "err";
    }

    # 如果 http://localhost/1.txt 404,将会跳转到@err并输出err

## 理解优先级

注意：优先级不分编辑location前后顺序

    server {
      listen      80;
      server_name  localhost;

      location  ~ .*\.(html|htm|gif|jpg|pdf|jpeg|bmp|png|ico|txt|js|css)$ {
        default_type text/html;
        return 200 "~";
      }

      location ^~ /static {
        default_type text/html;
        return 200 "^~";
      }

      location / {
        root   /Users/xiejiahe/Documents/nginx/nginx/9000/;
        error_page 404 @err;
      }

      location = /static {
        default_type text/html;
        return 200 "=";
      }

      location ~* ^/static$ {
        default_type text/html;
        return 200 "~*";
      }

      location @err {
        default_type text/html;
        return 200 "err";
      }
    }

- 输出了 = ,因为 = 表示严格相等,而且优先级是最高

  =


- 输出 ^~ , 匹配前缀为 /static

  ^~


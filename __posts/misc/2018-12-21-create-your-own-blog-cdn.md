---
layout: post
title: 为Github Pages Jekyll网站添加CDN
category: Misc
tags: Jekyll Github
keywords: Jekyll 博客 网站 Github 域名 HTTPS CDN
description: 利用阿里云CDN加速Github Pages网站获取加速和stiemap爬取
date: 2018-12-26T13:19:54+08:00
score: 5
coverage: jekyll_logo.png
---

## 1. 背景

- 在上一篇教程中已经教会了大家怎么使用[Github Page + Jekyll + markdown + 自己域名搭建自己的技术博客网站](/2018/12/21/create-your-own-blog.html)
- 但是这个网站对于中国大陆用的用户访问的响应速度非常慢
- 添加sitemap到360搜索引擎和百度搜索引擎因为IP地址的原因,不能被他们收录

### 接下来我就教大家怎么使用阿里云的CDN服务解决以上问题

- 因为自己的域名在阿里云所以导致,的域名迁移到自他CDN服务商比较麻烦
- 选择自己的CDN服务商最好根据自己域名提供商决定
- 如果您愿意,也可以把自己的域名转移到另外的CDN服务商

## 2. 准备

- [阿里云CDN控制台](https://cdn.console.aliyun.com/#/overview)
- [阿里云DNS控制台](https://dns.console.aliyun.com/#/dns/domainList)
- [Github Pages 项目设置选项卡](https://github.com)

## 3. Github Pages项目设置

- ping 您github pages 项目获取ip,这个IP地址在下一步CDN设置回源会使用到
    ```shell
    $ ping dejavuzhou.github.com
    $ 正在 Ping dejavuzhou.github.io [185.199.109.153] 具有 32 字节的数据:
    ```
- 设置您自定义的域名

  ![](/assets/image/jekyll_fork07.png)

- 不要勾选 Enforce HTTPS
  > 原因:在Github中强制开启 HTTPS 导致CDN里面设置https失败

  ![](/assets/image/gitpage_ali_cdn01.png)

## 4. 阿里云CDN配置

- 阿里云CDN->域名管理->添加域名

  ![](/assets/image/gitpag_cdn_add.png)

- 域名点击完成之后 返回域名列表, 获取 CNAME 值 (可能需要刷新等待一分钟)

  ![](/assets/image/gitpage_cdn_domain_list.png)

- 到DNS管理控制台中设置CNAME值

  ![](/assets/image/gitpage_dns_add_cname.png)

  域名生效需要等待几分钟

- (可选开启HTTPS 和HTTP2 TLS HSTS)回到DNS管理控制台

    - 开启免费证书 HTTPS

      ![](/assets/image/gitpage_cdn_https.png)

    - HTTPS配置:选择是否强制HTTPS跳转,HTTP2,HSTS...

      ![](/assets/image/gitpage_cdn_config.png)

      **注意:不要开启子域名 HSTS 会导致其他的域名出错**

## 5. 运行效果

![](/assets/image/gitpage_network_cache.png)

## More

- [创建Github Page Jekyll 教程](/2018/12/21/create-your-own-blog.html)
- [如果有什么疑问请在文章下评论](https://github.com/libragen/dejavuzhou.github.io/issues)


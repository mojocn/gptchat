---
layout: post
title: "Go进阶46:Prometheus Chart Alert 报表告警架构"
category: Golang
tags: Go进阶 
keywords: "Prometheus Chart Alert 告警 图表报表 监控 架构 Openstack  TSDB 时序数据库"
description: "Prometheus Chart Alert 告警 图表报表 监控 架构  TSDB 时序数据库 "
coverage: prometheus_chart_report_alert_adl.png
permalink: /go/:title
date: 2020-07-24T18:06:00+08:00
---

- Blue圆角框:  后端需要开发任务
- Cyan圆角框:  前端要开发的任务
- **TSDB(时序数据库) 非常适合做time聚合统计, 不适合做表格报表数据查询展示, 因为数据都是时序的所以非常适合做Chart图表查询**

## 1. 旧版告警/报表/Monitor疼点

内部自研(Moon) 基于influxDB自主开发,使用HTTP API 封装时序数据库查询, 文档不完善, 没有成熟的社区支持, 功能致敬借鉴Prometheus.
报表模块数据来源多Mysql/ES, 每添加一种类型数据需要大量的计算聚合golang代码, 非常难找到抽象的报表数据查询规则.
告警模块数据的解耦 依靠定时任务在kafka自我produce,自我consume, 告警规则都是通过MySQL数据库查询策略, Golang代码条件匹配.
扩展告警规需要新增加golang代码.告警模块,报表模块是非数据导向(先有原型图,在填充查询数据).

## 2. Prometheus的优势

- Prometheus 不仅能够做性能监控,还可以做业务数据的监控
- Prometheus Grafana 图像化界面支持 Prometheus TSDB(时序数据库) 查询语法(PromQL), 是一个非常棒的 Chart Report 工具.
- Prometheus Alert-Manager 只需要编写 PromQL 告警规则, 结合自定义开发的Alert-Manager-Hook, 快捷的,解耦的,灵活的,满足告警需求.
- Prometheus 有完善的文档,活跃的社区.

![普罗米修斯 alert manager 架构](/assets/image/prometheus-alert-adl.png)

### 2.1 Prometheus 不仅仅只是运维硬件性能监控工具

您可以把业务数据转换成metrics 数据保存到prometheus TSDB(时序数据库) .利用时许数据库的特性和PromQL语法快速简便的输出Chart报表数据.
也可以利用Alert-Manager 监控业务数据的变化 eg: 如果一小时内有20用户登陆失败, 通知相关人员.

## 3. 重构需求和方案介绍

重构需求:

- 灵活增加报表类型(样式,数据),只需要写html-template(html/css) + prometheus 查询语句, 后端golang代码不需要修改
- 灵活自定义告警规则,只需要写 prometheus 查询语句, 后端golang代码不需要修改

新需求需要以数据导向:

- 需求必须先从数据采集开始, 不能先从报表,告警原型开始,简而言之需要以数据导向.什么样的数据出什么样的需求. 不能因为需求而组装数据.
- 需求流程:  1. 需求确定要收集那些数据(业务 or 机器信息)    2. 根据已有数据来确定查询展示的内容 3. 根据已有数据来确定告警规则

### 3.1 Prometheus 数据采集

Prometheus server 只保存报表和告警的相关数据: CPU, Mem, Disk-IO, Net-IO, Process , 授权变动, 费用变动, 日志事件, 用户登录事件

#### 3.1.1 OpenStack 如何在创建的虚拟机上安装 node-exporter?

- 方案一: node exporter 和启动shell一起初始化到 OpenStack 镜像里面
- 方案二: openstack 虚拟机初始化的时候 提供统一的 ssh账号和密码, 后端服务golang远程(内网)执行安装shell安装脚本

#### 3.1.2 Prometheus 如何发现已经安装启动完毕node-exporter的虚拟机?

prometheus 配置openstack的管理API账号密码,自主发现exporter,  
https://prometheus.io/docs/prometheus/latest/configuration/configuration/#openstack_sd_config

#### 3.1.3 Prometheus 如何Pull后端服务的业务数据?

后端服务 import  "github.com/prometheus/client_golang"   
详细Example示例代码  https://github.com/prometheus/client_golang/tree/master/examples/simple

### 3.2 报表模块

旧版: 新增加报表需要后端写golang 查询代码进行数据统计, 然后前端出html-template, 联调.

目标: 新增加报表只需编写前端代码样式和PromQL. 新的告警规则秩序填写通知人和PromQL

#### 3.2.1 报表的生成流程?

第一步: 使用Grafana 管理界面(Prometheus Playground) 调试好自己需要的Chart图表的数据, 确定需要展示的样式和PromQL查询语法
第二步: 前端编写图表前端代码,和粘贴上一步生成的PromQL 查询语句,提交后端
第三步: 后端根据前端的报表模板,render页面
第四步: 生成多种格式报表
第五步: 发送(Email...)报表

#### 3.2.2 报表如何做的灵活可配置?

Prometheus & Grafana 提供Playground, 可以测试您需要的数据,和提前预览验证您的Chart报表,
前端根据 Grafana 来编写自己的报表的样式.

### 3.3 告警模块

旧版: 新增加告警策略,或增加告警监控项, 需要golang后端 匹配告警策略和 写if 判断语句完成触发逻辑
目标: 只需要编写验证PromQL来确定告警规则

#### 3.3.1 项目告警规则如何编写?

第一步: 在Prometheus Grafana ( Playground ) 中实验您的告警规则 生成PromQL语法
第二部: 前端表单提交PromQL的告警规则(也可以内置)
第三步: 后端把前端提交的告警规则生成 Prometheus Alert Manager的告警规则
第四步: 后端把生成好Rules 写入Prometheus 配置文件
第五步: Prometheus Reload 配置文件,Alert-Manager加载新的告警规则

#### 3.3.2 Prometheus 告警如何跟后端结合?

后端开发编写Prometheus Alert Hook API,
后端通过Hook API: 1. 记录触发的事件到数据库,提供前端展示 2. 发送Email 同时收件人
Prometheus Alert Manger 配置文件中填写好开发测试完成的 Alert Hook API 地址

## 4. 附录

- **TSDB(时序数据库) 非常适合做time聚合统计, 不适合做表格报表数据查询展示, 因为数据都是时序的所以非常适合做Chart图表查询**
- [Go进阶31:Prometheus Client教程](/go/prometheus-client-for-go)
- [使用Prometheus和Grafana做可视化大屏展示](/2019/08/20/dash-graph-of-prometheus)
- [Prometheus 自定义数据收集(Exporter/Client) Demo代码](https://github.com/prometheus/client_golang/tree/master/examples)
- [Prometheus Alert Web Hook 开发教程](https://yunlzheng.gitbook.io/prometheus-book/parti-prometheus-ji-chu/alert/alert-manager-use-receiver/alert-manager-extension-with-webhook)
- [Prometheus Query 语法文档](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Openstack Exporter 发现  OpenStack SD configurations allow retrieving scrape targets from OpenStack Nova instances](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
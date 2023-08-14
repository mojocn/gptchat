---
layout: post
title: Go进阶20:使用Github Actions教程
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,使用Github Actions(CI)教程
description:  Go语言教程,Golang教程,使用Github Actions(CI)教程
permalink: /go/:title
coverage: github_actions_coverage.png
date: 2019-08-30T12:00:00+08:00
---


Github Actions是Github推出的一个新的功能,可以为我们的项目自动化地构建工作流,
例如代码检查,自动化打包,测试,发布版本等等.入口在项目pull request的旁边.
Github Actions 目前处于beta阶段,需要申请Beta体验资格.
[Github Actions Beta 申请体验资格入口网站](https://github.com/features/actions/signup).

## 1.什么是Github Actions

> GitHub Actions allow you to implement custom logic without having to create an app to perform the task you need.
> You can combine GitHub Actions to create workflows using an action defined in your repository,
> a public repository on GitHub, or a published Docker container image.
> GitHub Actions are customizable and can use the GitHub API and any publicly available third-party APIs to interact with a repository.
> For example, an action can publish npm modules, send SMS alerts when urgent issues are created, or deploy production ready code.
> You can discover, create, and share your GitHub Actions with the GitHub community.

GitHub Actions允许您实现自定义逻辑,而无需创建应用程序来执行您需要的任务.
您可以通过通过在Github public仓库定义Action或者通过您发布的docker镜像来创建workflow.
GitHub操作是可自定义的,可以调用GitHub API和任何公开可用的第三方API与Github Repo进行交互.
例如,操作可以发布npm模块,在发送紧急Issue时发送SMS警报,或部署production代码.
您可以通过GitHub社区发现,创建和共享您的GitHub Actions.

## 2.Github Actions能够做什么

1. 通过Github Actions 您可以每次Github事件(push,pull-request,merge,issue,comment...)执行您的代码.
2. (Travis/CircleCI功能相似)最常见的功能就是持续集成(CI),您可以在Github Actions中创建测试代码,使用Email/SMS接受测试的反馈.
3. (Travis/CircleCI功能相似)可以查看特定运行的日志.
4. GitHub操作支持运行任意代码,因此您可以做的不仅仅是构建和测试代码.

## 3.Golang Github Actions基本workflow

工作流定义一个或多个Job.每个Job都包含多个步骤,例如检查源代码,安装Go工具链,构建和测试Go代码等.
workflow由GitHub托管的计算机上运行.这些服务是对私有仓库收费,功能仓库免费.

一下构建和测试Go包的最简单的workflow.在您的public仓库`.github/workflows/go.yml`中创建一下代码：

```yaml
name: TechMojotvGo
on: push
jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Set up Go 1.12
        uses: actions/setup-go@v1
        with:
          go-version: 1.12
        id: go

      - name: Check out source code
        uses: actions/checkout@v1

      - name: Build
        run: go build .

      - name: Test
        run: go test -v .
```

让我们来解读一下`.github/workflows/go.yml`

### 3.1定义工作流的名称

`name`定义GitHub Actions 的名称,Actions在GitHub的repo视图的选项卡中可见.

```yaml
name: TechMojotvGo
```

### 3.2指定触发workflow的事件

工作流由GitHub repo中的事件触发.有许多事件类型,包括push,pull request,merge...等.

`on:push` 表示：当Github 收到push代码.
您可以使用yaml数组指定多个事件：

```yaml
on: [push, pull_request]
```

### 3.3指定执行工作流的操作系统

runs-on定义运行工作流的机器的操作系统.最常见的：

- ubuntu-latest ：ubuntu 18.04（将来可能会更新）
- macos-latest
- windows-latest

[常见的操作系统列表](https://help.github.com/en/articles/virtual-environments-for-github-actions)

### 3.4定义Job

Job是一系列操作

```yaml
jobs:
  build:
    name: BuildJobName
```

我们只定义一个build的job, `name`可见名称为BuildJobName.

我们可以定义多个job. job并行运行,但它们是在一个空的环境中开始的,所以如果您有多个步骤,比如构建和测试,那么把他们合并成一个单一任务会更快.

### 3.5安装Golang工具链

```yaml
- name: Set up Go 1.12
  uses: actions/setup-go@v1
  with:
    go-version: 1.12
  id: go
```

Actions的美妙之处在于它们是开源的并且可以被共享.
actions/setup-go是https://github.com/actions/setup-go中托管的操作.如果您需要调整Actions的工作方式,可以将其fork并进行修改优化.

Actions可以是JavaScript（node.js）脚本或docker镜像.
actions/setup-go是一个node.js actions.

`name`是人类可读的步骤名称.
Action可以接受我们提供的参数`with` `go-version`是一个`actions/setup-go`能够解析的参数.它定义了我们要安装的Go版本.

### 3.6编译和测试代码

```yaml
- name: Build
  run: go build .

- name: Test
  run: go test -v .
```

我们可以逐步执行任意命令.
Go代码最常见的步骤是：构建它并运行测试.执行命令时的默认工作目录是源代码目录.当步骤失败时,workflow将停止,您将收到一封电子邮件.

## 4.Github高级feature

### 4.1使用secret

有时您需要使用一个您不能公开的secret.在此示例中,我们有一个部署到Netlify帐户的项目.

在GitHub UI中,我们定义了`NETLIFY_TOKEN` 使用Netlify进行身份验证所需的`secret`：

![](/assets/image/github_actions_secret.png)
{% raw %}

接下来我们在`.github/workflows/go.yml`中使用他

```yaml
- name: Netlify deploy
  env:
    NETLIFY_TOKEN: $\{\{secrets.NETLIFY_TOKEN\}\}
  run: |
    ./netlifyctl -A $\{\{secrets.NETLIFY_TOKEN\}\} deploy || true
    cat netlifyctl-debug.log || true
```

我们可以在工作流.yml文件中访问secret `\{\{ secrets.NETLIFY_TOKEN \}\}` .我们可以作为参数传递给用`runor` 执行的命令,如本例所示,设置环境变量use env.
{% endraw %}
请记住,已记录执行命令的`stdout`和`stderr`
,因此请小心不要打印secret.[更多关于secret的信息](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables).

```code
因为jekyll-liquid 语法 和 vuejs 语法的问题 请把 \{ 替换成 {  \} 替换成 }
```

### 4.2调试workflow

workflow正在远程服务器上运行,因此如果出现问题,可能很难弄清楚原因.

这里有一些tips：

- 阅读有关[机器设置（文件系统布局,环境变量）](https://help.github.com/en/articles/virtual-environments-for-github-actions)和仔细检查脚本中的假设
- 阅读有[关机器上安装的软件的信息](https://help.github.com/en/articles/software-in-virtual-environments-for-github-actions)
- 如果您不确定,请添加更多日志记录.例如,如果您不确定当前目录是否是您期望的目录,请在发生错误之前将其记录（在Linux上 echo "打印当前目录: `pwd`"）

## 5.总结

由于github action还算比较新的功能,大部分功能机制和Travis/CircleCI类似,但是Github Actions可以获取更多的Github Actions权限,目前还在Beta状态还有很多不足.

相关文档

- https://github.com/features/actions
- Github Action 配置模板: https://github.com/actions/starter-workflows
- Github Beta 测试申请: https://github.com/features/actions/signup
- Github 操作虚拟环境: https://help.github.com/en/articles/virtual-environments-for-github-actions
- Github Action Workflow 语法: https://help.github.com/en/articles/workflow-syntax-for-github-actions
 
---
layout: post
title: Go进阶12:怎么开发一个热门的开源项目
category: Golang
tags: Go进阶
description: 有一个好主意并不能保证您的项目成功.您需要应用最佳实践来使其广为人知.您需要怎么样才能让您的golang开源项目为人熟知,让您的项目有1000+star,您需要做一下这些来推广您的开源项目,同时需要保证您项目的代码质量
keywords: golang,GitHub,开源项目,开源项目推广
date: 2019-01-07T13:19:54+08:00
score: 5.0
coverage: golang_lib_awesome.jpeg
---

## 1.前言

有一个好主意并不能保证您的项目成功.您需要应用最佳实践来使其广为人知.
您需要怎么样才能让您的golang开源项目为人熟知.让您的项目有1000+star,您需要做一下这些来推广您的开源项目,同时需要保证您项目的代码质量

## 2.文档

- readme.md:它提供了关于项目功能的描述.
- LICENSE.md:它为开发人员提供了可以为项目做出贡献的信息.
- CONTRIBUTING.md:它提供了为我们的项目做出贡献所需要遵循的步骤.
- CHANGELOG.md:它包含了一个按时间顺序排列的,针对每个项目版本的显著变化的精心策划的列表.
- Wiki:除了代码中的文档外,我们还应该提供Wiki.

## 3.代码风格

- `golangci-lint`:它迫使我们遵循最佳实践来开发代码.我是[golangci-lint](https://github.com/golangci/golangci-lint)的超级粉丝,因为它提供了大量的连接程序,并且很容易与项目集成.
- `go fmt`:在将代码放入存储库之前,应该对其进行格式化.

## 4.单元测试

项目的高测试覆盖率不能保证项目没有bug.另一方面,高覆盖率使您的项目更容易被其他人理解.

![](/assets/image/golang_unit_test.jpeg)

## 5.Makefile

多亏了makefile,您的go开发过程更加有效和流畅.[这里有一个很好的例子](https://github.com/wesovilabs/koazee/blob/master/Makefile).

## 持续集成

将CI工具集成到项目中,并在README.md中显示状态.最著名的ci工具是`Travis`和`Circle`.在网上可以找到几个[例子](https://github.com/wesovilabs/koazee/blob/master/Makefile).

## 6.Release

只要需要提供新功能,就创建项目的新版本.修正了以前版本的bug.
[语义版本](https://semver.org/lang/zh-CN/)控制是为我们的版本命名的方法.[您可以在这里找到一篇好文章](https://blog.gopheracademy.com/advent-2015/semver/)

    版本格式：主版本号.次版本号.修订号,版本号递增规则如下：
    
    - 主版本号：当您做了不兼容的 API 修改,
    - 次版本号：当您做了向下兼容的功能性新增,
    - 修订号：当您做了向下兼容的问题修正.
    
    先行版本号及版本编译元数据可以加到“主版本号.次版本号.修订号”的后面,作为延伸.

## 7.issue 和 pull request

为新特性和检测到的bug创建问题.
只需通过拉请求将代码推入主分支即可.即使您是唯一的贡献者,也要像其他人的贡献一样,让您的更改通过代码评审过程.

![](/assets/image/golang_awesome_git.png)

## 8.给您的项目添加徽章

- [goreportcard.com](http://goreportcard.com/):保证您的项目应用最好的go实践.
- [godoc.org](http://goreportcard.com/): go包的官方文档.
- [codecov.io](http://codecov.io/):有很多类似的工具,但我打赌这是因为它

还有很多其他网站可以让您获得徽章.

## 9.宣传您的项目

让人们知道您的项目

- 推特:用#golang给您的推贴贴标签
- Reddit:在https://www.reddit.com/r/golang上分享您的项目
- GoLibHunt在https://go.libhunt.com上分享您的版本
- 谷歌组:在论坛上公布您的项目

当您的项目已经足够成熟,并且您已经完成了上述步骤时,您应该使您的项目成为[awesome-go社区](https://github.com/avelino/awesome-go)的一部分.

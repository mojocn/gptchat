---
layout: post
title: 'MISC:windows10安装jekyll和ruby环境'
category: Misc
tags: jekyll
description: windows10安装jekyll和ruby环境
keywords: windows10,安装,jekyll,ruby
score: 5.0
coverage: jekyll_logo.png
published: true
---

## 背景

最近想试试用Jekyll在Github搭建blog.选取网站模板,修改域名等等这些网上都有很详细的教程了,文末会附上链接,这里就不再赘述了.本文主要记录在Windows本地安装jekyll环境的过程,遇到的问题及如何解决的.

## 安装环境

### 1. 安装Ruby

在Windows上使用RubyInstaller安装比较方便,去Ruby [https://rubyinstaller.org/downloads/](https://rubyinstaller.org/downloads/)官网下载最新版本的RubyInstaller.注意32位和64位版本的区分.
注意：勾选添加到PATH选项,以便在命令行中使用.

![](/assets/image/ruby_01.png)

添加PATH

安装完成界面：

![](/assets/image/ruby_02.png)

Ruby安装完成

这里需要勾选安装msys2,后面安装gem和jekyll时会用到：

安装msys2和development toolchain

### 2. 安装RubyGems

Windows中下载ZIP (下载页面 https://rubygems.org/pages/download)格式比较方便,下载后解压到任意路径.打开Windows的cmd界面,输入命令：
$ cd {unzip-path} // unzip-path表示解压的路径

```cgo
$ gem install jekyll
unknown encoding name "chunked\r\n\r\n25" for ext/ruby_http_parser/vendor/http-parser-java/tools/parse_tests.rb, skipping
Successfully installed public_suffix-3.1.1
Successfully installed addressable-2.6.0
Successfully installed colorator-1.1.0
Temporarily enhancing PATH for MSYS/MINGW...
Building native extensions. This could take a while...
Successfully installed http_parser.rb-0.6.0
Successfully installed eventmachine-1.2.7-x64-mingw32
Successfully installed em-websocket-0.5.1
Successfully installed concurrent-ruby-1.1.5
Successfully installed i18n-0.9.5
Successfully installed ffi-1.11.1-x64-mingw32
Successfully installed rb-inotify-0.10.0
Successfully installed rb-fsevent-0.10.3
Successfully installed sass-listen-4.0.0

Ruby Sass has reached end-of-life and should no longer be used.

* If you use Sass as a command-line tool, we recommend using Dart Sass, the new
  primary implementation: https://sass-lang.com/install

* If you use Sass as a plug-in for a Ruby web framework, we recommend using the
  sassc gem: https://github.com/sass/sassc-ruby#readme

* For more details, please refer to the Sass blog:
  https://sass-lang.com/blog/posts/7828841

Successfully installed sass-3.7.4
Successfully installed jekyll-sass-converter-1.5.2
Successfully installed ruby_dep-1.5.0
Successfully installed listen-3.1.5
Successfully installed jekyll-watch-2.2.1
Successfully installed kramdown-1.17.0
Successfully installed liquid-4.0.3
Successfully installed mercenary-0.3.6
Successfully installed forwardable-extended-2.6.0
Successfully installed pathutil-0.16.2
Successfully installed rouge-3.6.0
Successfully installed safe_yaml-1.0.5
Successfully installed jekyll-3.8.6
Parsing documentation for public_suffix-3.1.1
Installing ri documentation for public_suffix-3.1.1
Parsing documentation for addressable-2.6.0
Installing ri documentation for addressable-2.6.0
Parsing documentation for colorator-1.1.0
Installing ri documentation for colorator-1.1.0
Parsing documentation for http_parser.rb-0.6.0
Installing ri documentation for http_parser.rb-0.6.0
Parsing documentation for eventmachine-1.2.7-x64-mingw32
Installing ri documentation for eventmachine-1.2.7-x64-mingw32
Parsing documentation for em-websocket-0.5.1
Installing ri documentation for em-websocket-0.5.1
Parsing documentation for concurrent-ruby-1.1.5
Installing ri documentation for concurrent-ruby-1.1.5
Parsing documentation for i18n-0.9.5
Installing ri documentation for i18n-0.9.5
Parsing documentation for ffi-1.11.1-x64-mingw32
Installing ri documentation for ffi-1.11.1-x64-mingw32
Parsing documentation for rb-inotify-0.10.0
Installing ri documentation for rb-inotify-0.10.0
Parsing documentation for rb-fsevent-0.10.3
Installing ri documentation for rb-fsevent-0.10.3
Parsing documentation for sass-listen-4.0.0
Installing ri documentation for sass-listen-4.0.0
Parsing documentation for sass-3.7.4
Installing ri documentation for sass-3.7.4
Parsing documentation for jekyll-sass-converter-1.5.2
Installing ri documentation for jekyll-sass-converter-1.5.2
Parsing documentation for ruby_dep-1.5.0
Installing ri documentation for ruby_dep-1.5.0
Parsing documentation for listen-3.1.5
Installing ri documentation for listen-3.1.5
Parsing documentation for jekyll-watch-2.2.1
Installing ri documentation for jekyll-watch-2.2.1
Parsing documentation for kramdown-1.17.0
Installing ri documentation for kramdown-1.17.0
Parsing documentation for liquid-4.0.3
Installing ri documentation for liquid-4.0.3
Parsing documentation for mercenary-0.3.6
Installing ri documentation for mercenary-0.3.6
Parsing documentation for forwardable-extended-2.6.0
Installing ri documentation for forwardable-extended-2.6.0
Parsing documentation for pathutil-0.16.2
Installing ri documentation for pathutil-0.16.2
Parsing documentation for rouge-3.6.0
Installing ri documentation for rouge-3.6.0
Parsing documentation for safe_yaml-1.0.5
Installing ri documentation for safe_yaml-1.0.5
Parsing documentation for jekyll-3.8.6
Installing ri documentation for jekyll-3.8.6
Done installing documentation for public_suffix, addressable, colorator, http_parser.rb, eventmachine, em-websocket, concurrent-ruby, i18n, ffi, rb-inotify, rb-fsevent, sass-listen, sass, jekyll-sass-converter, ruby_dep, listen, jekyll-watch, kramdown, liquid, mercenary, forwardable-extended, pathutil, rouge, safe_yaml, jekyll after 22 seconds
25 gems installed
Admin@FelixZhou MINGW64 /
$ jekyll -v
jekyll 3.8.6

```

### 3. 安装Jekyll

在cmd中输入:
$ gem install jekyll

### 4. 安装jekyll-paginate

在cmd中输入：
$ gem install jekyll-paginate

### 5. 验证安装完成

在cmd中输入：
$ jekyll -v

输出版本说明安装完成（我的版本为3.7.3）：
jekyll 3.7.3

### 6. 开启本地实时预览

切换到仓库所在目录,在cmd中输入:

`$ jekyll serve`

遇到问题及解决

1. gem install jekyll时报错,而且还是乱码！

```shell
C:\User>gem install jekyll
Temporarily enhancing PATH for MSYS/MINGW...
Building native extensions. This could take a while...
ERROR:  Error installing jekyll:
    ERROR: Failed to build gem native extension.

    current directory: C:/Ruby25-x64/lib/ruby/gems/2.5.0/gems/http_parser.rb-0.6.0/ext/ruby_http_parser
C:/Ruby25-x64/bin/ruby.exe -r ./siteconf20180308-3672-ueo7ea.rb extconf.rb
creating Makefile

current directory: C:/Ruby25-x64/lib/ruby/gems/2.5.0/gems/http_parser.rb-0.6.0/ext/ruby_http_parser
 make "DESTDIR=" clean
 'make' �����ڲ����ⲿ���Ҳ���ǿ����еĳ���
���������ļ���

current directory: C:/Ruby25-x64/lib/ruby/gems/2.5.0/gems/http_parser.rb-0.6.0/ext/ruby_http_parser
make "DESTDIR="
'make' �����ڲ����ⲿ���Ҳ���ǿ����еĳ���
 ���������ļ���

 make failed, exit code 1

Gem files will remain installed in C:/Ruby24-x64/bin/ruby_builtin_dlls/Ruby24-x6
4/lib/ruby/gems/2.4.0/gems/http_parser.rb-0.6.0 for inspection.
Results logged to C:/Ruby24-x64/bin/ruby_builtin_dlls/Ruby24-x64/lib/ruby/gems/2
.4.0/extensions/x64-mingw32/2.4.0/http_parser.rb-0.6.0/gem_make.out
```

参考oneclick/rubyinstaller2`的`issue #98`.
首先cmd中输入：
`$ chcp 850`

切换编码之后安装：
`$ gem install jekyll`

下面是报错：

```cgo
Temporarily enhancing PATH for MSYS/MINGW...
Building native extensions. This could take a while...
ERROR:  Error installing jekyll:
        ERROR: Failed to build gem native extension.

    current directory: C:/Ruby25-x64/lib/ruby/gems/2.5.0/gems/http_parser.rb-0.6.0/ext/ruby_http_parser
C:/Ruby25-x64/bin/ruby.exe -r ./siteconf20180308-3672-ueo7ea.rb extconf.rb
creating Makefile

current directory: C:/Ruby25-x64/lib/ruby/gems/2.5.0/gems/http_parser.rb-0.6.0/ext/ruby_http_parser
make "DESTDIR=" clean
'make' 不是内部或外部命令,也不是可运行的程序或批处理文件.

current directory: C:/Ruby25-x64/lib/ruby/gems/2.5.0/gems/http_parser.rb-0.6.0/ext/ruby_http_parser
make "DESTDIR="
'make' 不是内部或外部命令,也不是可运行的程序或批处理文件.

make failed, exit code 1

Gem files will remain installed in C:/Ruby25-x64/lib/ruby/gems/2.5.0/gems/http_p
arser.rb-0.6.0 for inspection.
Results logged to C:/Ruby25-x64/lib/ruby/gems/2.5.0/extensions/x64-mingw32/2.5.0
/http_parser.rb-0.6.0/gem_make.out
```

原来是没有`make`指令,上面的步骤其实已经安装了`msys2`,所以不会出现问题.对于没有勾选的童鞋,可以在`cmd`中输入下面命令来安装：
`$ ridk install`

安装完成之后再次安装`jekyll`和`jekyll-paginate`就ok了.

2. `jekyll serve`启动报错

```cgo
Incremental build: disabled. Enable with --incremental
      Generating...
jekyll 3.7.3 | Error:  Permission denied @ rb_sysopen - C:/Users/username/NTUSER.DAT

```

这是因为`jekyll`默认使用`4000`端口,而4000是`FoxitProtect`（福昕阅读器的一个服务）的默认端口.网上有教程说kill掉FoxitProtect的进程,但是我觉得首先这个比较麻烦,其次重启计算机时FoxitProtect是默认启动的,除非关闭这个服务,这样又可能带来其他问题.所以最简单的办法还是指定端口：
`$ jekyll serve -P 5555`

### 8. 添加jekyll/bin 到环境变量

![](/assets/image/ruby_03.png)

### 7. 安装jekyll依赖

```cgo
$ bundle exec jekyll serve
Could not find gem 'github-pages x64-mingw32' in any of the gem sources listed in your Gemfile.
Run `bundle install` to install missing gems.
```

使用 `bundle install` 安装依赖

```cgo
$ bundle install
Fetching gem metadata from https://rubygems.org/...............
Fetching gem metadata from https://rubygems.org/..
Resolving dependencies...
Using concurrent-ruby 1.1.5
Using i18n 0.9.5
Using minitest 5.11.3
....
```

## 在自己的IDE中运行

进入自己的jekyll项目代码目录,运行 `bundle exec jekyll serve`
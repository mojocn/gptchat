---
layout: post
title: 'MISC:windows10安装GCC和G++'
category: Misc
tags: shell gcc g++
description: windows10安装GCC和G++
keywords: windows10安装GCC和G++
score: 5.0
coverage: gcc_logo.jpg
published: true
---

`windows`下配置`g++/gcc`环境有两种方法,分别是`cygnus`和`Mingw`,本处采用以`Mingw`为准的说明

## 1. 下载包管理器

MinGw官网: www.mingw.org
下载(32位): https://osdn.net/projects/mingw/downloads/68260/mingw-get-setup.exe/
下载(64位): https://sourceforge.net/projects/mingw-w64/

## 2. 进行安装

按照提示一路下去,要注意的是可以根据自己的需要选择是否更改安装路径(一定要记住这个路径)
包管理器安装完成后,选择mingw-gcc-g++（class属性为bin）,右键点击Mark for installation
菜单栏（左上角）选择Installation中的Apply changes选项
如果出现某种原因安装未能成功,选择review changes选项重新安装

## 3. 环境变量的配置

进入我的电脑右击选择属性 —> 高级系统设置 —> 环境变量
在系统环境变量中找到Path,选中并编辑
新增,填写刚刚下载的`Mingw`下`bin`文件夹的路径,如果没有修改,那默认的路径则是`C:\MinGW\bin`

## 4. 查看是否配置成功

`win+R` 输入`cmd`或者`powershell`,进入终端界面
输入`g++ -v`查看版本号
输入`gcc -v`查看版本号
如果不行,重新返回第二步进行安装

## 5. 开始旅行

打开终端软件,将已经写好的cpp文件进行编译和运行

`g++ temp.cpp && a.exe`

打开终端软件,将已经写好的`cpp`文件进行编译和运行

`gcc temp.c && a.exe`
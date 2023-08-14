---
layout: post
title: stream盗号木马病毒代码剖析
category: Misc
tags: 黑客 hack
description: 盗号木马病毒代码剖析
keywords: 盗号木马亡刃,伪装成迅游加速器,陌陌语音,腾讯免费加速器
score: 5.0
coverage: 360sfafe00.jpg
published: true
---

## Brief

近期,360安全大脑截获到一批盗号木马“亡刃”,伪装成“迅游加速器”,“陌陌语音”,“腾讯免费加速器”,“变声器”等多种小程序通过QQ群进行传播,感染用户机器后盗取用户的Steam帐号密码,盗取集结号游戏,辰龙游戏,850游戏插件的配置文件,同时还会记录用户的键盘记录,盗取QQkey等.

![](/assets/image/360sfafe01.jpg)

## 整体病毒流程

该木马从2018年12月开始传播,近半年来一直保持着很高的活跃度,感染用户机器达到上万台.不过广大用户不必担心,360安全卫士可全面查杀该盗号木马,且其独有的“Steam盗号防护”可从7大方面层层拦截Steam盗号攻击,建议广大用户及时下载安装360安全卫士,保护个人隐私及财产安全.

![](/assets/image/360sfafe02.jpg)

## 瞄准Steam玩家诱骗再登录,拦截帐号密码回传大本营

病毒运行后,创建下列线程分别执行不同的病毒逻辑：

![](/assets/image/360sfafe03.jpg)

创建一个线程设置RememberPassword的值为0,使得用户每次登陆游戏都需要输入帐号密码：

![](/assets/image/360sfafe04.jpg)

然后遍历进程,结束正在运行的steam相关进程,强迫用户重新登陆,以执行盗号逻辑：

![](/assets/image/360sfafe05.jpg)

然后继续遍历进程,当`steam.exe`进程再次启动时,将资源中的`steamHK`通过`DLL`注入的方式注入到`steam.exe`进程中执行,相关注入逻辑如下：

![](/assets/image/360sfafe06.jpg)

steamHk.dll通过内联挂钩的方式挂钩vstdlib_s.dll动态库的V_strncpy函数,该函数会在用户输入密码时被steamUI.dll调用,病毒通过hook该函数,拦截用户输入的帐号密码等参数.

![](/assets/image/360sfafe07.jpg)

过滤帐号密码的函数如下：

![](/assets/image/360sfafe08.jpg)

最后将截取到的帐号密码保存到Steam安装目录下的A.txt中.

![](/assets/image/360sfafe09.jpg)

创建一个线程将A.txt中的帐号密码,以及ssfn授权文件等发送到http[:]//104.143.94.77/nc/n/getfile1.php：

![](/assets/image/360sfafe10.jpg)

下发棋牌类游戏盗号木马,窃取配置文件上传服务器
创建一个线程将资源中的病毒文件server.exe释放到系统目录下执行：

![](/assets/image/360sfafe11.jpg)

server.exe在内存中解密并加载动态链接库flyboy.dll,并调用其导出函数Host(),代码如下:

![](/assets/image/360sfafe12.jpg)

相关的解密逻辑如下：

![](/assets/image/360sfafe13.jpg)

flyboy.dll会创建一个线程解密资源中的C&C服务器地址,并尝试连接,线程功能与旧版的Gh0st远控类似.然后将server.exe拷贝到随机目录下并注册为自启动项.检测Rstray.exe和KSafeTray.exe等安全软件进程,通过Vmware的后门指令检测当前运行环境是不是虚拟机,当确定运行环境安全时,则会创建一个线程去C&C服务器下载并执行棋牌类游戏盗号模块,整体的代码逻辑如下：

![](/assets/image/360sfafe14.jpg)

下载的1.exe会将资源中的work.dll释放到Temp目录下,并注册到RemoteAccess服务项当中,最后调用rundll32.exe执行病毒动态库的XiaoDeBu导出函数,代码逻辑如下：

![](/assets/image/360sfafe15.jpg)

work.dll会记录用户的键盘记录,先获取当前活动窗口,并记录窗口标题以及击键记录,将其保存到Luck.ley文件中：

![](/assets/image/360sfafe16.jpg)

盗取集结号游戏插件,辰龙游戏插件以及850游戏插件的配置文件：

![](/assets/image/360sfafe17.jpg)

以集结号插件为例：

![](/assets/image/360sfafe18.jpg)

最后会将Luck.key中记录的敏感数据进行异或0x62后发送到病毒作者控制的服务器上,相关逻辑如下：

![](/assets/image/360sfafe19.jpg)

魔高一尺,道高一丈,360安全大脑强力查杀,“亡刃”为盗号可谓费劲心机,无奈魔高一尺,道高一丈.针对该盗号木马的攻击感染态势,360安全大脑已经全面实施查杀.

![](/assets/image/360sfafe20.jpg)

## 转载自 [360安全卫士](https://zhuanlan.zhihu.com/p/65957801)
















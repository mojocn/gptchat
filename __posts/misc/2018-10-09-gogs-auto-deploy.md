---
layout: post
title: Gogs代码自动部署
category: Misc
tags: Git
keywords: Gogs,git,linux
date: 2018-12-26T13:19:54+08:00
description: 把您的d_server的公钥添加的您要自动部署的仓库中,配置正确的效果:登陆到d_server,使用git clone 可以面密码克隆要部署的代码
---

## 知识储备

* [设置ssh免密码登陆linux](https://www.jianshu.com/p/e9db116fef8c)
* [linux执行多行命令](https://stackoverflow.com/questions/4412238/what-is-the-cleanest-way-to-ssh-and-run-multiple-commands-in-bash)

***

1. 您代码需要部署到的服务器叫d_server(www.host.com); 您gogs安装的服务器叫做g_server(git.host.com)
2. g_server有两个用户一个root,另外一个是gogs运行的用户也是gogs官方推荐的用户git
3. 把您的d_server的公钥添加的您要自动部署的仓库中,配置正确的效果:登陆到d_server,使用git clone 可以面密码克隆要部署的代码
4. 把您的g_server的公钥添加到d_server allow_keys里面去,正确效果是 在g_server上可以免密码登陆到d_server
5. 第一步要做的是d_server上执行git clone 代码,获取要部署的代码
6. 在gogs的仓库中设置git的post_recieve hook-脚本

```shell
#!/bin/sh
#gogs所在的g_server去ssh登陆到d_server,并在d_server执行ENDSSH之间bash命令
#ENDSSH 之间的代码您可以自己根据实际情况调整
ssh -T root@www.host.com <<'ENDSSH'
      source ~/.bashrc #加载环境变量 建议保留
      source /etc/profile #加载环境变量 建议保留
      source ~/.bash_profile #加载环境变量 建议保留
      project_dir="/data/deploy/webSPA"  #代码被部署的目录, 这个目录您以前已经手git clone了一遍了
      cd $project_dir #进入代码目录
      git reset --hard #清理git 
      git pull #拉取仓管最新代码
      cnpm install #安装node依赖包
      npm run build #编译vue
      build_dist='/data/webSPA_dist/' #编译好的目录  后面操作都是防止编译的时候静态代码不能访问
      rm -rf $build_dist #删除之前编译好nginx指向的文件
      cp -R dist $build_dist #复制到编译好的文件到 nginx指向的目录
ENDSSH
```

### 以后您每次向gogs服务器push代码之后他会自动执行post-recieve 钩子自动帮您部署代码.
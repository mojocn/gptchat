---
layout: post
title: Git常见的命令集合
category: CheatSheet
tags: [Git,CheatSheet,快速入门,快速查询]
keywords: Git常用的git命令,快捷查表
score: 4
date: 2019-08-02T13:19:54+08:00

---

## 库管理

### 克隆库

```bash
git clone https://github.com/golang/golang-src.git
git clone --depth=1 https://github.com/golang/golang-src.git # 只抓取最近的一次 commit
```

### 创建已有新的repo

```bash
echo "# ss" >> README.md
git init
git add README.md
git commit -m "first commit"
git remote add origin git@github.com:mojocn/ss.git
git push -u origin master
```

### 推送已有的repo

```bash 
git remote add origin git@github.com:mojocn/ss.git
git push -u origin master
```

## 历史管理

### 查看历史

```bash
git log --pretty=oneline filename # 一行显示
git show xxxx # 查看某次修改
```

### 标签功能

```bash    
git tag # 显示所有标签
git tag -l 'v1.4.2.*' # 显示 1.4.2 开头标签
git tag v1.3 # 简单打标签   
git tag -a v1.2 9fceb02 # 后期加注标签
git tag -a v1.4 -m 'my version 1.4' # 增加标签并注释, -a 为 annotated 缩写
git show v1.4 # 看某一标签详情
git push origin v1.5 # 分享某个标签
git push origin --tags # 分享所有标签
```

### 回滚操作

```bash
git reset 9fceb02 # 保留修改
git reset 9fceb02 --hard # 删除之后的修改
```

### 取消文件的修改

```bash
git checkout -- a.golang #  取消单个文件
git checkout -- # 取消所有文件的修改
```

### 删除文件

```bash
git rm a.golang  # 直接删除文件
git rm --cached a.golang # 删除文件暂存状态
```

### 移动文件

```bash
git mv a.golang ./test/a.golang
```

### 查看文件修改

```bash
git diff          # 查看未暂存的文件更新 
git diff --cached # 查看已暂存文件的更新 
```

### 暂存和恢复当前staging

```bash
git stash # 暂存当前分支的修改
git stash apply # 恢复最近一次暂存
git stash list # 查看暂存内容
git stash apply stash@{2} # 指定恢复某次暂存内容
git stash drop stash@{0} # 删除某次暂存内容
```

### 修改 commit 历史纪录

```bash
git rebase -i 0580eab8
```

## 分支管理

### 创建分支

```bash
git branch develop # 只创建分支
git checkout -b master develop # 创建并切换到 develop 分支
```

### 合并分支

```bash
git checkout master # 切换到 master 分支
git merge --no-ff develop # 把 develop 合并到 master 分支,no-ff 选项的作用是保留原分支记录
git rebase develop # rebase 当前分支到 develop
git branch -d develop # 删除 develop 分支
```

### Stash 当前分支中未提交的修改移动到其他分支：

```bash
git stash
git checkout branch2
git stash pop
```

将 stashed changes 应用到当前分支：
git stash apply
删除最新一次的 stashed changes：
git stash drop

### 克隆远程分支

```bash
git branch -r # 显示所有分支,包含远程分支
git checkout origin/android
```

### 修复develop上的合并错误

1. 将merge前的commit创建一个分之,保留merge后代码
2. 将develop `reset --force`到merge前,然后`push --force`
3. 在分支中rebase develop
4. 将分支push到服务器上重新merge

### 强制更新到远程分支最新版本

```bash
git reset --hard origin/master
git submodule update --remote -f
```

## Submodule使用

### 克隆带submodule的库

```bash
git clone --recursive https://github.com/chaconinc/MainProject
```

### clone主库后再去clone submodule

```bash
git clone https://github.com/chaconinc/MainProject
git submodule init
git submodule update
```

## Git设置

Git的全局设置在`~/.gitconfig`中,单独设置在`project/.git/config`下.

忽略设置全局在`~/.gitignore_global`中,单独设置在`project/.gitignore`下.

### 设置 commit 的用户和邮箱

```bash
git config user.name "xx"
git config user.email "xx@xx.com"
```

或者直接修改config文件

```bash
[user]
    name = xxx
    email = xxx@xxx.com
```

### 查看设置项

```bash
git config --list
```

### 设置git终端颜色

```bash
git config --global color.diff auto
git config --global color.status auto
git config --global color.branch auto
```

---

### 更新与发布

### 列出当前配置的远程端：

```
$ git remote -v
```

### 显示远程端的信息：

```
$ git remote show <remote>
```

### 添加新的远程端：

```
$ git remote add <remote> <url>
```

### 下载远程端版本,但不合并到HEAD中：

```
$ git fetch <remote>
```

### 下载远程端版本,并自动与HEAD版本合并：

```
$ git remote pull <remote> <url>
```

### 将远程端版本合并到本地版本中：

```
$ git pull origin master
```

### 以rebase方式将远端分支与本地合并：

```
git pull --rebase <remote> <branch>
```

### 将本地版本发布到远程端：

```
$ git push remote <remote> <branch>
```

### 删除远程端分支：

```
$ git push <remote> :<branch> (since Git v1.5.0)
or
git push <remote> --delete <branch> (since Git v1.7.0)
```

### 发布标签:

```
$ git push --tags
```

---

### 合并与重置(Rebase)

### 将分支合并到当前HEAD中：

```
$ git merge <branch>
```

### 将当前HEAD版本重置到分支中:

<em><sub>请勿重置已发布的提交!</sub></em>

```
$ git rebase <branch>
```

### 退出重置:

```
$ git rebase --abort
```

### 解决冲突后继续重置：

```
$ git rebase --continue
```

### 使用配置好的merge tool 解决冲突：

```
$ git mergetool
```

### 在编辑器中手动解决冲突后,标记文件为`已解决冲突`：

```
$ git add <resolved-file>
```

```
$ git rm <resolved-file>
```

### 合并提交：

```
$ git rebase -i <commit-just-before-first>
```

把上面的内容替换为下面的内容：

原内容：

```
pick <commit_id>
pick <commit_id2>
pick <commit_id3>
```

替换为：

```
pick <commit_id>
squash <commit_id2>
squash <commit_id3>
```

---

## 撤销

### 放弃工作目录下的所有修改：

```
$ git reset --hard HEAD
```

### 移除缓存区的所有文件（i.e. 撤销上次`git add`）:

```
$ git reset HEAD
```

### 放弃某个文件的所有本地修改：

```
$ git checkout HEAD <file>
```

### 重置一个提交（通过创建一个截然不同的新提交）

```
$ git revert <commit>
```

### 将HEAD重置到指定的版本,并抛弃该版本之后的所有修改：

```
$ git reset --hard <commit>
```

### 用远端分支强制覆盖本地分支：

```
git reset --hard <remote/branch> e.g., upstream/master, origin/my-feature
```

### 将HEAD重置到上一次提交的版本,并将之后的修改标记为未添加到缓存区的修改：

```
$ git reset <commit>
```

### 将HEAD重置到上一次提交的版本,并保留未提交的本地修改：

```
$ git reset --keep <commit>
```

### 删除添加`.gitignore`文件前错误提交的文件：

```
$ git rm -r --cached .
$ git add .
$ git commit -m "remove xyz file"
```

---
layout: post
title: "Notes002:gin 简洁快速日志查看工具"
category: Misc
tags: Linux
keywords: "golang gin 快速日志查看工具"
description: "golang gin 快速日志查看工具"
coverage: golang_gin_log_h.png
permalink: /misc/:title
date: 2020-12-29T16:23:45+08:00
---

## 1. 解决疼点

1. 远程服务器日志查看太繁琐
2. linux命令太繁琐
3. 简单几行代码就可以快速查看日志

## 2. gin.HandlerFunc 代码

```go
func apiListLog(logDir string) gin.HandlerFunc {
	//logDir 保存日志的目录
    //建议在开发/beta环境中使用
	return func(c *gin.Context) {
		if p := c.Query("f"); p != "" {
			//日志文件的绝对路径
			c.File(p) //网页展示日志文件内容
			return
		}
		if logDir == "" {
			c.String(200, "%s", "logDir is empty")
			return
		}
		//render 日志文件中的全部内容
		buff := new(bytes.Buffer)
		err := filepath.Walk(logDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.IsDir() {
				fmt.Fprintf(buff, `<li><a href="log?f=%s" title="%dKB">%s</a></li>`, path, info.Size()>>10,path)
			}
			return nil
		})
		if err != nil {
			c.String(200, "%v", err)
		} else {
			c.Data(http.StatusOK, "text/html; charset=utf-8", buff.Bytes())
		}
	}
}
```

## 3. 使用方法

1. 把上面 gin.HandlerFunc 注册到gin路由
2. 注意:请在生产环境不要开启, 或者在生产环境设置认证密码...
3. 在网页中访问 这个handler 查看日志
---
layout: post
title: go代码示例:操作文件获取路径目录
category: Golang
tags: golang 文件
description: golang操作文件,读写删除,移动链接文件
keywords: 文件,golang,目录,gopath,文件打包
date: 2018-12-26T13:19:54+08:00
---

## 获取GOPATH

用法:得到`GOPATH`环境变量,就可以使用绝对路径访问一些目录和文件了

```go
package main

import (
    "fmt"
    "go/build"
    "os"
)

func main() {
    gopath := os.Getenv("GOPATH")
    if gopath == "" {
        gopath = build.Default.GOPATH
    }
    fmt.Println(gopath)
}
```

## 文件创建/写/读

创建目录

```go
//mkdir 
func Mkdir(name string, perm FileMode) error
//相当于bash中的 mkdir -p
func MkdirAll(path string, perm FileMode) error
```

文件操作

```go
package main

import (
	"fmt"
	"io"
	"os"
	"log"
)

var path = "/Users/novalagung/Documents/temp/test.txt"

func main() {
	createFile()
	writeFile()
	readFile()
	deleteFile()
}

func createFile() {
	// 检查文件是否存在
	var _, err = os.Stat(path)

	// create file if not exists
	if os.IsNotExist(err) {
		var file, err = os.Create(path)
		if isError(err) { return }
		defer file.Close()
	}

	fmt.Println("==> done creating file", path)
}

func openFileOrCreate(){
	//如果文件存在就清空内容
	//如果不存在既就创建0666的文件
	f,err := os.Create("my.txt")
	if err != nil {
		log.Println(err)
	}
	log.Println(f)
}

func writeFile() {
	// open file using READ & WRITE permission
	var file, err = os.OpenFile(path, os.O_RDWR, 0644)
	if isError(err) { return }
	defer file.Close()

	// write some text line-by-line to file
	_, err = file.WriteString("halo\n")
	if isError(err) { return }
	_, err = file.WriteString("mari belajar golang\n")
	if isError(err) { return }

	// save changes
	err = file.Sync()
	if isError(err) { return }

	fmt.Println("==> done writing to file")
}

func readFile() {
	// re-open file
	var file, err = os.OpenFile(path, os.O_RDWR, 0644)
	if isError(err) { return }
	defer file.Close()

	// read file, line by line
	var text = make([]byte, 1024)
	for {
		_, err = file.Read(text)
		
		// break if finally arrived at end of file
		if err == io.EOF {
			break
		}
		
		// break if error occured
		if err != nil && err != io.EOF {
			isError(err)
			break
		}
	}
	
	fmt.Println("==> done reading from file")
	fmt.Println(string(text))
}

func deleteFile() {
	// delete file
	var err = os.Remove(path)
	if isError(err) { return }

	fmt.Println("==> done deleting file")
}

func isError(err error) bool {
	if err != nil {
		fmt.Println(err.Error())
	}

	return (err != nil)
}
```

## 遍历文件夹

```go
package main
import (
 "path/filepath"
 "os"
 "io/ioutil"
 "fmt"
 "strings"
)
//这个方法不能直接使用需要您自己在进行编辑
func walkDir(dir,outFile string) error{
		    w, err := os.Create(outFile)
		    if err != nil {
		    	return err
		    }

			filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
				//如果是文件夹
    			if info.IsDir() {
    				return nil
    			}
    			//读取文件内容
    			b, err := ioutil.ReadFile(path)
    			if err != nil {
    				return err
    			}
    			path = filepath.ToSlash(path)
    			//文件专函成bytes 方便编译到可执行文件中
    			fmt.Fprintf(w, `	assets[%q] = []byte{`, strings.TrimPrefix(path, dir))
    			for i := 0; i < len(b); i++ {
    				if i > 0 {
    					fmt.Fprintf(w, `, `)
    				}
    				fmt.Fprintf(w, `0x%02x`, b[i])
    			}
    			fmt.Fprintln(w, `}`)
    			return nil
    		})
		    return nil
}

```

## 文件重命名/移动删除

```go
//移动和重命名
func Rename(oldpath, newpath string) error
//删除
func Remove(name string) error
func RemoveAll(path string) error
//链接文件
func Symlink(oldname, newname string) error

```
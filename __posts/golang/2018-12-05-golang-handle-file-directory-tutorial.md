---
layout: post
title: 使用golang操作文件和目录
category: Golang
tags: golang 文件 操作
date: 2018-12-26T13:19:54+08:00
description: Go语言中的reader和writer接口也类似.我们只需简单的读写字节,不必知道reader的数据来自哪里,也不必知道writer将数据发送到哪里.
---

## 概要

UNIX 的一个基础设计就是"万物皆文件"(everything is a file).
我们不必知道一个文件到底映射成什么,操作系统的设备驱动抽象成文件.操作系统为设备提供了文件格式的接口.

Go语言中的reader和writer接口也类似.我们只需简单的读写字节,不必知道reader的数据来自哪里,也不必知道writer将数据发送到哪里.
您可以在/dev下查看可用的设备,有些可能需要较高的权限才能访问.

## 1.创建空文件

```go
package main
 
import (
	"log"
	"os"
)
 
func main() {
	emptyFile, err := os.Create("empty.txt")
	if err != nil {
		log.Fatal(err)
	}
	log.Println(emptyFile)
	emptyFile.Close()
}
```

## 创建空文件

```go
package main
 
import (
	"log"
	"os"
)
 
func main() {
	_, err := os.Stat("test")
 
	if os.IsNotExist(err) {
		errDir := os.MkdirAll("test", 0755)
		if errDir != nil {
			log.Fatal(err)
		}
 
	}
}
```

## 重命名文件

```go
package main
 
import (
	"log"
	"os"
)
 
func main() {
	oldName := "test.txt"
	newName := "testing.txt"
	err := os.Rename(oldName, newName)
	if err != nil {
		log.Fatal(err)
	}
}
```

## 移动文件

`os.Rename()` 可以用来重命名和移动文件

```go
package main
 
import (
	"log"
	"os"
)
 
func main() {
	oldLocation := "/var/www/html/test.txt"
	newLocation := "/var/www/html/src/test.txt"
	err := os.Rename(oldLocation, newLocation)
	if err != nil {
		log.Fatal(err)
	}
}
```

## 复制文件

`io.Coppy`是复制文件的关键

```go
package main
 
import (
	"io"
	"log"
	"os"
)
 
func main() {
 
	sourceFile, err := os.Open("/var/www/html/src/test.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer sourceFile.Close()
 
	// Create new file
	newFile, err := os.Create("/var/www/html/test.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer newFile.Close()
 
	bytesCopied, err := io.Copy(newFile, sourceFile)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Copied %d bytes.", bytesCopied)
}
``` 

## 获取文件的metadata信息: `os.Stat()`

```go
package main
 
import (
	"fmt"
	"log"
	"os"
)
 
func main() {
	fileStat, err := os.Stat("test.txt")
 
	if err != nil {
		log.Fatal(err)
	}
 
	fmt.Println("File Name:", fileStat.Name())        // Base name of the file
	fmt.Println("Size:", fileStat.Size())             // Length in bytes for regular files
	fmt.Println("Permissions:", fileStat.Mode())      // File mode bits
	fmt.Println("Last Modified:", fileStat.ModTime()) // Last modification time
	fmt.Println("Is Directory: ", fileStat.IsDir())   // Abbreviation for Mode().IsDir()
}
```

## 删除文件: `os.Remove()`

```go
package main
 
import (
	"log"
	"os"
)
 
func main() {
	err := os.Remove("/var/www/html/test.txt")
	if err != nil {
		log.Fatal(err)
	}
}
```

## 读取文件字符: `bufio.NewScanner()`

```go
package main
 
import (
	"bufio"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
)
 
func main() {
	filename := "test.txt"
 
	filebuffer, err := ioutil.ReadFile(filename)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	inputdata := string(filebuffer)
	data := bufio.NewScanner(strings.NewReader(inputdata))
	data.Split(bufio.ScanRunes)
 
	for data.Scan() {
		fmt.Print(data.Text())
	}
}
```

## 清除文件

`os.Truncate()` 说明

- 裁剪一个文件到100个字节.
- 如果文件本来就少于100个字节,则文件中原始内容得以保留,剩余的字节以null字节填充.
- 如果文件本来超过100个字节,则超过的字节会被抛弃.
- 这样我们总是得到精确的100个字节的文件.
- 传入0则会清空文件.

```go
package main
 
import (
	"log"
	"os"
)
 
func main() {
	err := os.Truncate("test.txt", 100)
 
	if err != nil {
		log.Fatal(err)
	}
}
```

## 向文件添加内容

```go
package main
 
import (
	"fmt"
	"os"
)
 
func main() {
	message := "Add this content at end"
	filename := "test.txt"
 
	f, err := os.OpenFile(filename, os.O_RDWR|os.O_APPEND|os.O_CREATE, 0660)
 
	if err != nil {
		fmt.Println(err)
		os.Exit(-1)
	}
	defer f.Close()
 
	fmt.Fprintf(f, "%s\n", message)
}
```

## 修改文件权限,时间戳

```go
package main
 
import (
	"log"
	"os"
	"time"
)
 
func main() {
	// Test File existence.
	_, err := os.Stat("test.txt")
	if err != nil {
		if os.IsNotExist(err) {
			log.Fatal("File does not exist.")
		}
	}
	log.Println("File exist.")
 
	// Change permissions Linux.
	err = os.Chmod("test.txt", 0777)
	if err != nil {
		log.Println(err)
	}
 
	// Change file ownership.
	err = os.Chown("test.txt", os.Getuid(), os.Getgid())
	if err != nil {
		log.Println(err)
	}
 
	// Change file timestamps.
	addOneDayFromNow := time.Now().Add(24 * time.Hour)
	lastAccessTime := addOneDayFromNow
	lastModifyTime := addOneDayFromNow
	err = os.Chtimes("test.txt", lastAccessTime, lastModifyTime)
	if err != nil {
		log.Println(err)
	}
}
```

## 压缩文件到ZIP格式

```go
package main
 
import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"os"
)
 
func appendFiles(filename string, zipw *zip.Writer) error {
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("Failed to open %s: %s", filename, err)
	}
	defer file.Close()
 
	wr, err := zipw.Create(filename)
	if err != nil {
		msg := "Failed to create entry for %s in zip file: %s"
		return fmt.Errorf(msg, filename, err)
	}
 
	if _, err := io.Copy(wr, file); err != nil {
		return fmt.Errorf("Failed to write %s to zip: %s", filename, err)
	}
 
	return nil
}
 
func main() {
	flags := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	file, err := os.OpenFile("test.zip", flags, 0644)
	if err != nil {
		log.Fatalf("Failed to open zip for writing: %s", err)
	}
	defer file.Close()
 
	var files = []string{"test1.txt", "test2.txt", "test3.txt"}
 
	zipw := zip.NewWriter(file)
	defer zipw.Close()
 
	for _, filename := range files {
		if err := appendFiles(filename, zipw); err != nil {
			log.Fatalf("Failed to add file %s to zip: %s", filename, err)
		}
	}
}
```

## 读取ZIP文件里面的文件

```go
package main
 
import (
	"archive/zip"
	"fmt"
	"log"
	"os"
)
 
func listFiles(file *zip.File) error {
	fileread, err := file.Open()
	if err != nil {
		msg := "Failed to open zip %s for reading: %s"
		return fmt.Errorf(msg, file.Name, err)
	}
	defer fileread.Close()
 
	fmt.Fprintf(os.Stdout, "%s:", file.Name)
 
	if err != nil {
		msg := "Failed to read zip %s for reading: %s"
		return fmt.Errorf(msg, file.Name, err)
	}
 
	fmt.Println()
 
	return nil
}
 
func main() {
	read, err := zip.OpenReader("test.zip")
	if err != nil {
		msg := "Failed to open: %s"
		log.Fatalf(msg, err)
	}
	defer read.Close()
 
	for _, file := range read.File {
		if err := listFiles(file); err != nil {
			log.Fatalf("Failed to read %s from zip: %s", file.Name, err)
		}
	}
}
```

## 解压ZIP文件

```go
package main
 
import (
	"archive/zip"
	"io"
	"log"
	"os"
	"path/filepath"
)
 
func main() {
	zipReader, _ := zip.OpenReader("test.zip")
	for _, file := range zipReader.Reader.File {
 
		zippedFile, err := file.Open()
		if err != nil {
			log.Fatal(err)
		}
		defer zippedFile.Close()
 
		targetDir := "./"
		extractedFilePath := filepath.Join(
			targetDir,
			file.Name,
		)
 
		if file.FileInfo().IsDir() {
			log.Println("Directory Created:", extractedFilePath)
			os.MkdirAll(extractedFilePath, file.Mode())
		} else {
			log.Println("File extracted:", file.Name)
 
			outputFile, err := os.OpenFile(
				extractedFilePath,
				os.O_WRONLY|os.O_CREATE|os.O_TRUNC,
				file.Mode(),
			)
			if err != nil {
				log.Fatal(err)
			}
			defer outputFile.Close()
 
			_, err = io.Copy(outputFile, zippedFile)
			if err != nil {
				log.Fatal(err)
			}
		}
	}
}
```
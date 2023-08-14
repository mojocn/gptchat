---
layout: post
title: Go教程:19-文件路径filepath
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,文件路径filePath
description:  Go语言教程,Golang教程,文件路径filePath,filepath-join
permalink: /:categories/:title
coverage: golang_package.jpg
date: 2019-09-07T09:20:54+08:00
---

[path/filepath](https://golang.google.cn/pkg/path/filepath/) 包涉及到路径操作时,路径分隔符使用 os.PathSeparator.
Go是一个跨平台的语言,不同系统,路径表示方式有所不同,比如 Unix 和 Windows 差别很大.本包能够处理所有的文件路径,不管是什么系统.

Go标准库中还有[path](https://golang.google.cn/pkg/path/), path 和 path/filepath 函数有点重复,大部分情况下建议使用 path/filepath.

## 1.示例代码:package path

```go
package main;
 
import (
    "fmt"
    "path"
)
 
//go语言path包的学习
 
func main() {
    //返回路径的最后一个元素
    fmt.Println(path.Base("./github.com/mojocn/c"));
    //如果路径为空字符串,返回.
    fmt.Println(path.Base(""));
    //如果路径只有斜线,返回/
    fmt.Println(path.Base("///"));
 
    //返回等价的最短路径
    //1.用一个斜线替换多个斜线
    //2.清除当前路径.
    //3.清除内部的..和他前面的元素
    //4.以/..开头的,变成/
    fmt.Println(path.Clean("./github.com/mojocn/../"));
 
    //返回路径最后一个元素的目录
    //路径为空则返回.
    fmt.Println(path.Dir("./github.com/mojocn/c"));
 
    //返回路径中的扩展名
    //如果没有点,返回空
    fmt.Println(path.Ext("./github.com/mojocn/c/d.jpg"));
 
    //判断路径是不是绝对路径
    fmt.Println(path.IsAbs("./github.com/mojocn/c"));
    fmt.Println(path.IsAbs("/github.com/mojocn/c"));
 
    //连接路径,返回已经clean过的路径
    fmt.Println(path.Join("./a", "b/c", "../d/"));
 
    //匹配文件名,完全匹配则返回true
    fmt.Println(path.Match("*", "a"));
    fmt.Println(path.Match("*", "a/b/c"));
    fmt.Println(path.Match("\\b", "b"));
 
    //分割路径中的目录与文件
    fmt.Println(path.Split("./github.com/mojocn/c/d.jpg"));
}
```

## 2.示例代码:package path/filepath

***`filepath.Join("C:/a", "/b", "/c")` 拼接目录***

```go
package main;
 
import (
    "path/filepath"
    "fmt"
    "os"
)
 
//学习filepath包,兼容各操作系统的文件路径
 
func main() {
    //返回所给路径的绝对路径
    path, _ := filepath.Abs("./1.txt");
    fmt.Println(path);
 
    //返回路径最后一个元素
    fmt.Println(filepath.Base("./1.txt"));
    //如果路径为空字符串,返回.
    fmt.Println(filepath.Base(""));
    //如果路径只有斜线,返回/
    fmt.Println(filepath.Base("///"));
 
    //返回等价的最短路径
    //1.用一个斜线替换多个斜线
    //2.清除当前路径.
    //3.清除内部的..和他前面的元素
    //4.以/..开头的,变成/
    fmt.Println(filepath.Clean("C:/github.com/mojocn/../c"));
    fmt.Println(filepath.Clean("./1.txt"));
 
    //返回路径最后一个元素的目录
    //路径为空则返回.
    fmt.Println(filepath.Dir("./github.com/mojocn/c"));
    fmt.Println(filepath.Dir("C:/github.com/mojocn/c"));
 
    //返回链接文件的实际路径
    path2, _ := filepath.EvalSymlinks("1.lnk");
    fmt.Println(path2);
 
    //返回路径中的扩展名
    //如果没有点,返回空
    fmt.Println(filepath.Ext("./github.com/mojocn/c/d.jpg"));
 
    //将路径中的/替换为路径分隔符
    fmt.Println(filepath.FromSlash("./github.com/mojocn/c"));
 
    //返回所有匹配的文件
    match, _ := filepath.Glob("./*.go");
    fmt.Println(match);
 
    //判断路径是不是绝对路径
    fmt.Println(filepath.IsAbs("./github.com/mojocn/c"));
    fmt.Println(filepath.IsAbs("C:/github.com/mojocn/c"));
 
    //连接路径,返回已经clean过的路径
    fmt.Println(filepath.Join("C:/a", "/b", "/c"));
 
    //匹配文件名,完全匹配则返回true
    fmt.Println(filepath.Match("*", "a"));
    fmt.Println(filepath.Match("*", "C:/github.com/mojocn/c"));
    fmt.Println(filepath.Match("\\b", "b"));
 
    //返回以basepath为基准的相对路径
    path3, _ := filepath.Rel("C:/github.com/mojocn", "C:/github.com/mojocn/c/d/../e");
    fmt.Println(path3);
 
    //将路径使用路径列表分隔符分开,见os.PathListSeparator
    //linux下默认为:,windows下为;
    fmt.Println(filepath.SplitList("C:/windows;C:/windows/system"));
 
    //分割路径中的目录与文件
    dir, file := filepath.Split("C:/github.com/mojocn/c/d.jpg");
    fmt.Println(dir, file);
 
    //将路径分隔符使用/替换
    fmt.Println(filepath.ToSlash("C:/github.com/mojocn"));
 
    //返回分区名
    fmt.Println(filepath.VolumeName("C:/github.com/mojocn/c"));
 
    //遍历指定目录下所有文件
    filepath.Walk("./", func(path string, info os.FileInfo, err error) error {
        fmt.Println(path)
        return nil
    })
}
```

## 3. 文件夹遍历

Go 语言中进行目录遍历的原生方法主要是以下3种：

- `filepath.Walk()`
- `ioutil.ReadDir()`
- `os.File.Readdir()`

性能是越底层越高（上层其实是对底层API的封装）.

### 3.1 filepath.Walk()

遍历根目录(root)下的文件树,为树中的每个文件或目录(包括根目录)调用walkFn.所有在访问文件和目录时出现的错误都由walkFn过滤.
遍历按词法顺序进行,这使得输出是确定的,但对于非常大的目录来说,遍历可能是低效的.
filepath.Walk()不会跟进符号链接.

```go
package main
 
import (
    "flag"
    "fmt"
    "os"
    "path/filepath"
)
 
const (
    layout = "2006-01-02 15:04:05"
)
 
func VisitFile(fp string, fi os.FileInfo, err error) error {
    if err != nil {
        fmt.Println(err) // can't walk here,
        return nil       // but continue walking elsewhere
    }
    if fi.IsDir() {
        return nil // not a file.  ignore.
    }
    // 过滤输出内容
    matched, err := filepath.Match("*.txt", fi.Name())
    if err != nil {
        fmt.Println(err) // malformed pattern
        return err       // this is fatal.
    }
    if matched {
        // fmt.Println(fp)
        fmt.Printf("Name: %s, ModifyTime: %s, Size: %v\n", fp, fi.ModTime().Format(layout), fi.Size())
    }
    return nil
}
 
func main() {
    var path = flag.String("path", ".", "The path to traverse.")
    flag.Parse()
 
    filepath.Walk(*path, VisitFile)
}
```

### 3.2 ioutil.ReadDir

filepath.Walk()会自动遍历子目录,但有些时候我们不希望这样,如果只想看当前目录,
或手动指定某几级目录中的文件,这个时候,可以使用 ioutil.ReadDir 进行替代.

```go
package main
 
import (
    "flag"
    "fmt"
    "io/ioutil"
    "log"
)
 
func main() {
    var path = flag.String("path", ".", "The path to traverse.")
    flag.Parse()
 
    files, err := ioutil.ReadDir(*path)
    if err != nil {
        log.Fatal(err)
    }
 
    for _, file := range files {
        fmt.Println(file.Name())
    }
}
```

## 3.3 os.File.os.File.Readdir

```go
package main
 
import (
    "fmt"
    "io/ioutil"
    "os"
    "path/filepath"
)
 
// https://stackoverflow.com/questions/14668850/list-directory-in-go/49196644#49196644
 
func main() {
    var (
        root  string
        err   error
    )
 
    // root = "/home/manigandan/Desktop/Manigandan/sample"
    root = "."
      f, err := os.Open(root)
      if err != nil {
          return files, err
      }
      fileInfo, err := f.Readdir(-1)
      f.Close()
      if err != nil {
          return files, err
      }
   
      for _, file := range fileInfo {
          fmt.Println(file.Name())
      }
}
```

### 3.4 方法封装的一个演示和对比

```go
package main
 
import (
    "fmt"
    "io/ioutil"
    "os"
    "path/filepath"
)
 
// https://stackoverflow.com/questions/14668850/list-directory-in-go/49196644#49196644
 
func main() {
    var (
        root  string
        files []string
        err   error
    )
 
    // root = "/home/manigandan/Desktop/Manigandan/sample"
    root = "."
    // filepath.Walk
    files, err = FilePathWalkDir(root)
    if err != nil {
        panic(err)
    }
    // ioutil.ReadDir
    files, err = IOReadDir(root)
    if err != nil {
        panic(err)
    }
    //os.File.Readdir
    files, err = OSReadDir(root)
    if err != nil {
        panic(err)
    }
 
    for _, file := range files {
        fmt.Println(file)
    }
}
 
func FilePathWalkDir(root string) ([]string, error) {
    var files []string
    err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
        if !info.IsDir() {
            files = append(files, path)
        }
        return nil
    })
    return files, err
}
 
func IOReadDir(root string) ([]string, error) {
    var files []string
    fileInfo, err := ioutil.ReadDir(root)
    if err != nil {
        return files, err
    }
 
    for _, file := range fileInfo {
        files = append(files, file.Name())
    }
    return files, nil
}
 
func OSReadDir(root string) ([]string, error) {
    var files []string
    f, err := os.Open(root)
    if err != nil {
        return files, err
    }
    fileInfo, err := f.Readdir(-1)
    f.Close()
    if err != nil {
        return files, err
    }
 
    for _, file := range fileInfo {
        files = append(files, file.Name())
    }
    return files, nil
}
```

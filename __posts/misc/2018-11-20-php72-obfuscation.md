---
layout: post
title: PHP代码混淆和加速
category: Misc
tags: toml
keywords: PHP7源代码混淆 PHP7 source code obfuscation
date: 2018-12-26T13:19:54+08:00
---

## 背景

因为项目的php代码需要保密处理,stackoverflow上找到两个选择

- [Zend Guard付费](http://www.zend.com/en/products/guard/)
- [Thicket Obfuscator for PHP](http://www.semdesigns.com/products/obfuscators/PHPObfuscator.html)
- [PHPprotect](http://www.phpprotect.info/)免费但是对代码混淆力度小,只是修改了变量的名称,基本满足需求

## 推荐使用`opcache`方式

### 1.[安装Opcache扩展](https://www.phpsong.com/1806.html)

php7默认是安装`opcache`的,我的配置为什么没有启用是因为没有加
`zend_extension=opcache.so`
创建opcode缓存目录:
`mkdir -m 777 /php_opcache/opcache_file_cache`
php.ini 配置文件和其他地方有点不同

```yaml
zend_extension=opcache.so
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
;opcache不保存注释,减少opcode大小
opcache.save_comments=0
;关闭PHP文件时间戳验证
opcache.validate_timestamps=Off
;每60秒验证php文件时间戳是否更新
;opcache.revalidate_freq=60
opcache.fast_shutdown=1
;注意,PHP7下命令行执行的脚本也会被 opcache.file_cache 缓存.
opcache.enable_cli=1
;设置不缓存的黑名单
;opcache.blacklist_filename=/png/php/opcache_blacklist
opcache.file_cache=/php_opcache/opcache_file_cache
opcache.file_cache_only=0
opcache.enable=On
```

`WARNING:`设置opcache缓存目录`opcache.file_cache=/php_opcache/opcache_file_cache`

重启 `php-fpm restart`

### 2.遍历项目的全部文件,生成opcache 二进制文件

遍历项目脚本
generate_project_opcache.php

```php
<?php
//您的php项目目录
$yourProjectPath = '/data/php/project_dir';
opcache_compile_files($yourProjectPath);
function opcache_compile_files($dir) {
	foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir)) as $v) {
		if(!$v->isDir() && preg_match('%\.php$%', $v->getRealPath())) {
		    //生成opcache编译文件
			opcache_compile_file($v->getRealPath());
			echo $v->getRealPath()."\n";
		}
	}
}
```

在命令行中执行 `php generate_project_opcache.php`遍历项目全部代码文件,生成`opcache`缓存
全部php文件都生成PHP文件一一对应的opcode(后缀为.php.bin)
![](/assets/image/php_opcache.jpg)

把缓存目录所有者设为php-fpm运行用户,我这里是png:
`sudo chown -R png:png /php_opcache/opcache_file_cache`

### 3.最后一步

** 清空 php源代码里面内容 ** 只保留文件名和目录结构
启动php-fpm:
`sudo php-fpm start`
访问的您的项目

## 最后

其中xxx是一个32位的md5编码的字符串.
部署到目标服务器的时候,需要保留项目中内容被清空的PHP脚本.
而且路径一定要对应导出opcode时的路径,文中的就是:
/png/www/example.com/public_html/app/pma
另外,PHP还可以使用函数`php_strip_whitespace()`删除PHP源码中的注释和空格.

`opcache.file_cache`用来保护代码逻辑应该还是可以的,
但不能确保里面定义的量的安全,比如加密密钥.存也可以,但防君子不防小人,门槛高点而已.

- [Zend Guard和ionCube加密的PHP脚本可以用DeZender/De-ionCube解密](http://dezender.net/))
- [Java字节码和Android APK可以用Java Decompiler反编译](http://jd.benow.ca/)
- Python脚本可以编译成pyc文件,不过pyc文件也很容易被反编译.
  所以包括opcache.file_cache这样的代码保护,也只能防君子不防小人.
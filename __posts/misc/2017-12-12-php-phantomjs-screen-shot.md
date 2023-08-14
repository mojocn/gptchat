---
layout: post
title: php调用phantomJS截图
category: Misc
tags: Javascript PhantomJS
keywords: php,linux,phantomjs,js
description: packagist上的composer包功能很冗余,我只需要用到phantomjs的截图功能
date: 2018-12-26T13:19:54+08:00
---

## 1. 背景

- 之前已经使用[golang写过调用phantomjs的文章](https://segmentfault.com/a/1190000015286871)
- CTO不让我使用golang所以只好使用php调用phantomjs
- packagist上的composer包功能很冗余,我只需要用到phantomjs的截图功能

## 2. 知识储备

- *unix系统安装phantomjs,权限相关知识
- 基本JavaScript语法知识
- php `exec`函数调用`REPL` phantomjs
- phantomjs js截图文档 http://javascript.ruanyifeng.com/tool/phantomjs.html

## 3. 代码(php 代码环境为yii2框架)

```php
<?php

namespace weapp\library\phantomjs;

use weapp\library\BizException;

class ScreenShot
{
    /** @var string 获取phantomjs 参数中 js文件的决定路径 */
    private $js_path;
    /** @var bool|string 获取php 有777权限的临时文件目录 */
    private $temp_dir;

    function __construct()
    {
        $dir = __DIR__;
        $this->js_path = "{$dir}/script.js";
        /** @var bool|string 获取php 有777权限的临时文件目录 */
        $this->temp_dir = \Yii::getAlias('@runtime');
    }

    /**
     * 截图并上传
     * @param string $url
     * @param string $filename
     * @return string
     * @throws BizException
     */
    public function screenShotThenSaveToOss(string $url, string $filename = 'temp.jpg')
    {
        //输出图片的路径
        $outputFilePath = "{$this->temp_dir}/$filename";
        //执行的phantomjs命令
        //phantomjs 可执行文件必须是 绝对路径 否则导致 exec 函数返回值127错误
        $cmd = "\usr\local\bin\phantomjs {$this->js_path} '$url' '$outputFilePath'";
        //捕捉不到phantomjs命令输出结果
        exec($cmd, $output);
        //检查截图文件是否存在
        $isShotImgaeExist = file_exists($outputFilePath);
        if (!$isShotImgaeExist) {
            throw new BizException(0, 'phantomjs截图失败', BizException::SELF_DEFINE);
        }
        //保存截图到oss
        $result = $this->postScreenShotImageToOss($outputFilePath);
        //删除临时文件夹的截图图片
        unlink($outputFilePath);
        return $result;
    }


    /**
     * 上传截图到阿里云直传oss
     * @param string $screenshot_path
     * @return string
     */
    public function postScreenShotImageToOss(string $screenshot_path): string
    {
        $ossKey = 'raw_file_name';

        $file = new \CURLFile($screenshot_path, 'image/jpeg', 'file');
        $tokenArray = $this->getOssPolicyToken('fetch');
        $url = $tokenArray->host;
        $postData = [
            'key' => "{$tokenArray->dir}/$ossKey",
            'policy' => $tokenArray->policy,
            'OSSAccessKeyId' => $tokenArray->accessid,
            'success_action_status' => '200',
            'signature' => $tokenArray->signature,
            'callback' => $tokenArray->callback,
            'file' => $file
        ];
        $ch = curl_init();
        //$data = array('name' => 'Foo', 'file' => '@/home/user/test.png');
        curl_setopt($ch, CURLOPT_URL, $url);
        // Disable SSL verification
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_SAFE_UPLOAD, true); // required as of PHP 5.6.0
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 20);
        //curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: $mime_type"]);

        $res = curl_exec($ch);
        $res = json_decode($res);
        curl_close($ch);
        if (empty($res) || $res->code != 0) {
            return '';
        } else {
            return $res->data->url;
        }
    }

    /**
     * 调用管理后台阿里云oss token接口
     * @param null $url
     * @return array
     */
    public function getOssPolicyToken($url = null)
    {
        $url = \Yii::$app->params['oss_screen_shot_token_api'];
        $ch = curl_init();
        // Disable SSL verification
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        // Will return the response, if false it print the response
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // Set the url
        curl_setopt($ch, CURLOPT_URL, $url);
        // Execute
        $result = curl_exec($ch);
        // Closing
        curl_close($ch);
        $res = json_decode($result);
        if (empty($res) || $res->code != 0) {
            return [];
        } else {
            return $res->data;
        }
    }
}


```

#### phantomjs javascript脚本内容

```javascript
"use strict";
var system = require('system');
var webPage = require('webpage');
var page = webPage.create();
//设置phantomjs的浏览器user-agent
page.settings.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1';

//获取php exec 函数的命令行参数
if (system.args.length !== 3) {
    console.log(system.args);
    console.log('参数错误');
    console.log('第2个参数为url地址 第3个参数为截图文件名称');
    phantom.exit(1);
}

//命令行 截图网址参数
var url = system.args[1];
//图片输出路径
var filePath = system.args[2];
console.log('-------');
console.log(url);
console.log('-------');
console.log(filePath);
console.log('-------');

//设置浏览器视口
page.viewportSize = {width: 480, height: 960};
//打开网址
page.open(url, function start(status) {
    //1000ms之后开始截图
    setTimeout(function () {
        //截图格式为jpg 80%的图片质量
        page.render(filePath, {format: 'jpg', quality: '80'});
        console.log('success');
        //退出phantomjs 避免phantomjs导致内存泄露
        phantom.exit();
    }, 1000);
});
```

## 4. 相关资料

- [golang chrome-dp 网页截图教程](/2018/12/26/chromedp-tutorial-for-golang)
- [PHP phantomjs 网页截图教程](/2018/12/26/php-phantomjs-screen-shot)
- [golang phantomjs 网页截图教程](/2018/12/26/phantomjs-tutorial-in-golang)
- [Python Selenium Chome-driver 网页截图教程](/python/selenium-chrome-driver-docker)
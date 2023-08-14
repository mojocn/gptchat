---
layout: post
title: "Notes001:IDE console中查看股票价格"
category: Misc
tags: Linux
keywords: "docker alpine golang hosts bugs"
description: "docker alpine golang hosts bugs"
coverage: ide_stock.png
permalink: /misc/:title
date: 2020-12-17T16:23:45+08:00
---

## IDE console中查看股票价格

```go
/*
Copyright © 2020 Eric Zhou <neochau@gmail.com>
This file is part of CLI application felix.
*/
package cmd

import (
	"bytes"
	"fmt"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// stockCmd represents the doctor command
var stockCmd = &cobra.Command{
	Use:   "stock",
	Short: "stock-fin",
	Long: `

`,
	Run: func(cmd *cobra.Command, args []string) {
		var headers []string
		for _,v := range template{
			headers = append(headers,v.Desc)
		}

		for {
			fmt.Fprintf(os.Stdout,"\u001b[2K\u001b[0;0H")
			table := tablewriter.NewWriter(os.Stdout)
			table.SetHeader(headers)
			table.SetBorder(true)
			table.SetHeaderColor(
				tablewriter.Colors{tablewriter.FgHiBlueColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgWhiteColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgCyanColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgHiRedColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgMagentaColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgGreenColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgYellowColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgYellowColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgYellowColor, tablewriter.Bold},
				tablewriter.Colors{tablewriter.FgYellowColor, tablewriter.Bold},

			)
			table.SetColumnColor(
				tablewriter.Colors{tablewriter.Bold, tablewriter.FgHiBlueColor},
				tablewriter.Colors{tablewriter.Normal, tablewriter.FgWhiteColor},

				tablewriter.Colors{tablewriter.Normal, tablewriter.FgCyanColor},
				tablewriter.Colors{tablewriter.Bold, tablewriter.FgHiRedColor},
				tablewriter.Colors{tablewriter.Normal, tablewriter.FgMagentaColor},
				tablewriter.Colors{tablewriter.Normal, tablewriter.FgGreenColor},
				tablewriter.Colors{tablewriter.Normal, tablewriter.FgYellowColor},
				tablewriter.Colors{tablewriter.Normal, tablewriter.FgYellowColor},
				tablewriter.Colors{tablewriter.Normal, tablewriter.FgYellowColor},
				tablewriter.Colors{tablewriter.Normal, tablewriter.FgYellowColor},

			)



			//row, err := stockPrice("hk01211")
			//if err != nil {
			//	log.Println(err)
			//	return
			//}
			//table.Append(row)
			row, err := stockPrice(arg.Code)
			if err != nil {
				log.Println(err)
				return
			}
			table.Append(row)

			row, err = stockPrice("sh600036") //股票代码
			if err != nil {
				log.Println(err)
				return
			}
			table.Append(row)
			table.SetCaption(true,time.Now().Format("UpdatedAt:"+time.RFC3339))
			table.Render()

			time.Sleep(time.Duration(arg.Interval) * time.Second)

		}
	},
}

var arg = struct {
	Code     string
	Interval int
}{}

func init() {
	rootCmd.AddCommand(stockCmd)
	stockCmd.Flags().StringVarP(&arg.Code, "code", "c", "sz002594", "股票代码")
	stockCmd.Flags().IntVarP(&arg.Interval, "interval", "i", 20, "股票价格刷新间隔second")

}

func stockPrice(stockCode string) (list []string, err error) {
	url := fmt.Sprintf("http://hq.sinajs.cn/list=%s", stockCode)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	bs, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	utf8, err := GbkToUtf8(bs)
	if err != nil {
		return nil, err
	}
	parts := strings.Split(string(utf8), `="`)
	body := parts[1]

	ps := strings.Split(body, ",")

	for _, v := range template {
		list = append(list, ps[v.Idx])
	}

	return

}


var template = []StockItem{
	{
		Idx:   0,
		Desc:  "Name",
		Value: "",
	},
	{
		Idx:   1,
		Desc:  "Today_Start_Price",
		Value: "",
	},
	{
		Idx:   2,
		Desc:  "Yesterday_End_Price",
		Value: "",
	},
	{
		Idx:   3,
		Desc:   "Current_Price" ,
		Value: "",
	},
	{
		Idx:   4,
		Desc:   "Today_Top" ,
		Value: "",
	},
	{
		Idx:   5,
		Desc:  "Today_Bottom",
		Value: "",
	},
	{
		Idx:   6,
		Desc:  "Buy_One",
		Value: "",
	},
	{
		Idx:   7,
		Desc:  "Sell_One",
		Value: "",
	},
	{
		Idx:   8,
		Desc:  "Deal_Amount",
		Value: "",
	},
	{
		Idx:   9,
		Desc:  "Deal_Money",
		Value: "",
	},
}

type StockItem struct {
	Idx   int
	Desc  string
	Value string
}

//0：”大秦铁路”，股票名字；
//1：”27.55″，今日开盘价；
//2：”27.25″，昨日收盘价；
//3：”26.91″，当前价格；
//4：”27.55″，今日最高价；
//5：”26.20″，今日最低价；
//6：”26.91″，竞买价，即“买一”报价；
//7：”26.92″，竞卖价，即“卖一”报价；
//8：”22114263″，成交的股票数，由于股票交易以一百股为基本单位，所以在使用时，通常把该值除以一百；
//9：”589824680″，成交金额，单位为“元”，为了一目了然，通常以“万元”为成交金额的单位，所以通常把该值除以一万；
//10：”4695″，“买一”申请4695股，即47手；
//11：”26.91″，“买一”报价；
//12：”57590″，“买二”
//13：”26.90″，“买二”
//14：”14700″，“买三”
//15：”26.89″，“买三”
//16：”14300″，“买四”
//17：”26.88″，“买四”
//18：”15100″，“买五”
//19：”26.87″，“买五”
//20：”3100″，“卖一”申报3100股，即31手；
//21：”26.92″，“卖一”报价
//(22, 23), (24, 25), (26,27), (28, 29)分别为“卖二”至“卖四的情况”
//30：”2008-01-11″，日期；
//31：”15:05:32″，时间；

func GbkToUtf8(s []byte) ([]byte, error) {
	reader := transform.NewReader(bytes.NewReader(s), simplifiedchinese.GBK.NewDecoder())
	d, e := ioutil.ReadAll(reader)
	if e != nil {
		return nil, e
	}
	return d, nil
}

func Utf8ToGbk(s []byte) ([]byte, error) {
	reader := transform.NewReader(bytes.NewReader(s), simplifiedchinese.GBK.NewEncoder())
	d, e := ioutil.ReadAll(reader)
	if e != nil {
		return nil, e
	}
	return d, nil
}


```
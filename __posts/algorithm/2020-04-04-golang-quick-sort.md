---
layout: post
title: 算法05:Golang快速排序Quick Sort
category: Algorithm
tags: algorithm 算法
description: "快速排序使用分治法(Divide and conquer)策略来把一个串行(list)分为两个子串行(sub-lists)"
keywords: algorithm,算法,quick-sort
date: 2020-04-04T13:19:54+08:00
score: 5.0
permalink: /algorithm/:title
coverage: Lomuto_animated.gif
published: true
---

## 1.什么是快速排序(Quick Sort)

快速排序是由东尼·霍尔所发展的一种排序算法.在平均状况下,排序 n 个项目要 Ο(nlogn) 次比较.在最坏状况下则需要 Ο(n2) 次比较,但这种状况并不常见.
事实上,快速排序通常明显比其他 Ο(nlogn) 算法更快,因为它的内部循环(inner loop)可以在大部分的架构上很有效率地被实现出来.

快速排序使用分治法(Divide and conquer)策略来把一个串行(list)分为两个子串行(sub-lists).

快速排序又是一种分而治之思想在排序算法上的典型应用.本质上来看,快速排序应该算是在冒泡排序基础上的递归分治法

## 2.算法步骤

![](/assets/image/quick_sort_partition_animation.gif)

1. 从数列中挑出一个元素,称为 “基准”(pivot)
2. 重新排序数列,所有元素比基准值小的摆放在基准前面,所有元素比基准值大的摆在基准的后面(相同的数可以到任一边).在这个分区退出之后,该基准就处于数列的中间位置.这个称为分区(partition)操作;
3. 递归地(recursive)把小于基准值元素的子数列和大于基准值元素的子数列排序;

递归的最底部情形,是数列的大小是零或一,也就是永远都已经被排序好了.
虽然一直递归下去,但是这个算法总会退出,因为在每次的迭代(iteration)中,它至少会把一个元素摆到它最后的位置去.

## 3. Golang代码实现

![](/assets/image/quick_sort_partition_animation.gif)

```go
func partition(list []int, low, high int) int {
	pivot := list[low] //导致 low 位置值为空
	for low < high {
		//high指针值 >= pivot high指针👈移
		for low < high && pivot <= list[high] {
			high--
		}
		//填补low位置空值
		//high指针值 < pivot high值 移到low位置
		//high 位置值空
		list[low] = list[high]
		//low指针值 <= pivot low指针👉移
		for low < high && pivot >= list[low] {
			low++
		}
		//填补high位置空值
		//low指针值 > pivot low值 移到high位置
		//low位置值空
		list[high] = list[low]
	}
	//pivot 填补 low位置的空值
	list[low] = pivot
	return low
}

func QuickSort(list []int,low,high int)  {
	if high > low{
		//位置划分
		pivot := partition(list,low,high)
		//左边部分排序
		QuickSort(list,low,pivot-1)
		//右边排序
		QuickSort(list,pivot+1,high)
	}
}

func TestQuickSort(t *testing.T) {
	list := []int{2,44,4,8,33,1,22,-11,6,34,55,54,9}
	QuickSort(list,0,len(list)-1)
	t.Log(list)
}
```

## 4. 学习资料

#### 数据结构与算法基础--第14周06--第8章排序6--8.3交换排序2--快速排序1

<iframe src="//player.bilibili.com/player.html?aid=38482542&bvid=BV17t411v7dH&cid=67645262&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

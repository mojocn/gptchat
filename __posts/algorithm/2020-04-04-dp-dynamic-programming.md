---
layout: post
title: 算法06:动态规划DP
category: Algorithm
tags: algorithm 算法
description: "动态规划算法是通过拆分问题,定义问题状态和状态之间的关系"
keywords: algorithm,算法,动态规划
date: 2020-04-04T13:19:55+08:00
score: 5.0
permalink: /algorithm/:title
coverage: dynamic_programming.png
published: true
---

## 1. 什么是动态规划?

动态规划(英语：Dynamic programming,简称DP)是一种在数学,管理科学,计算机科学,经济学和生物信息学中使用的,通过把原问题分解为相对简单的子问题的方式求解复杂问题的方法.
动态规划常常适用于有重叠子问题和最优子结构性质的问题,动态规划方法所耗时间往往远少于朴素解法.
动态规划背后的基本思想非常简单.大致上,若要解一个给定问题,我们需要解其不同部分(即子问题),再根据子问题的解以得出原问题的解.

通常许多子问题非常相似,为此动态规划法试图仅仅解决每个子问题一次,从而减少计算量：一旦某个给定子问题的解已经算出,则将其记忆化存储,以便下次需要同一个子问题解之时直接查表.这种做法在重复子问题的数目关于输入的规模呈指数增长时特别有用.
动态规划算法是通过拆分问题,定义问题状态和状态之间的关系,使得问题能够以递推(或者说分治)的方式去解决.在学习动态规划之前需要明确掌握几个重要概念.

- 阶段：对于一个完整的问题过程,适当的切分为若干个相互联系的子问题,每次在求解一个子问题,则对应一个阶段,整个问题的求解转化为按照阶段次序去求解.
- 状态：状态表示每个阶段开始时所处的客观条件,即在求解子问题时的已知条件.状态描述了研究的问题过程中的状况.
- 决策：决策表示当求解过程处于某一阶段的某一状态时,可以根据当前条件作出不同的选择,从而确定下一个阶段的状态,这种选择称为决策.
- 策略：由所有阶段的决策组成的决策序列称为全过程策略,简称策略.
- 最优策略：在所有的策略中,找到代价最小,性能最优的策略,此策略称为最优策略.
- 状态转移方程：状态转移方程是确定两个相邻阶段状态的演变过程,描述了状态之间是如何演变的.

## 2. 那些使用场景?

能采用动态规划求解的问题的一般要具有 3 个性质：

1.最优化：如果问题的最优解所包含的子问题的解也是最优的,就称该问题具有最优子结构,即满足最优化原理.子问题的局部最优将导致整个问题的全局最优.换句话说,就是问题的一个最优解中一定包含子问题的一个最优解.
2.无后效性：即某阶段状态一旦确定,就不受这个状态以后决策的影响.也就是说,某状态以后的过程不会影响以前的状态,只与当前状态有关,与其他阶段的状态无关,特别是与未发生的阶段的状态无关.
3.重叠子问题：即子问题之间是不独立的,一个子问题在下一阶段决策中可能被多次使用到.(该性质并不是动态规划适用的必要条件,但是如果没有这条性质,动态规划算法同其他算法相比就不具备优势)

## 3. 算法流程

1.划分阶段：按照问题的时间或者空间特征将问题划分为若干个阶段.
2.确定状态以及状态变量：将问题的不同阶段时期的不同状态描述出来.
3.确定决策并写出状态转移方程：根据相邻两个阶段的各个状态之间的关系确定决策.
4.寻找边界条件：一般而言,状态转移方程是递推式,必须有一个递推的边界条件.
5.设计程序,解决问题

## 4. LeetCode 121买卖股票的最佳时机

[LeetCode 121买卖股票的最佳时机](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock/)

题解如下:

### 4.1状态

买入`buy`卖出`sell`这两种状态.

### 4.2转移方程

对于买来说,买之后可以卖出(进入卖状态),也可以不再进行股票交易(保持买状态).

对于卖来说,卖出股票后不在进行股票交易(还在卖状态).

只有在手上的钱才算钱,手上的钱购买当天的股票后相当于亏损.也就是说当天买的话意味着损失`-prices[i]`,当天卖的话意味着增加`prices[i]`,当天卖出总的收益就是 `buy+prices[i]`.

所以我们只要考虑当天买和之前买哪个收益更高,当天卖和之前卖哪个收益更高.

`buy = max(buy, -price[i])`  (注意：根据定义 `buy` 是负数)

`sell = max(sell, prices[i] + buy)`

### 4.3边界

第一天` buy = -prices[0], sell = 0`,最后返回 `sell` 即可.

### 4.4 golang题解

```go
func maxProfit(prices []int) int {
    n := len(prices)
    if n < 1{
        return 0
    }
   buy,sell := -prices[0],0
   for i:=1;i<n;i++{
       buy = max(buy,-prices[i])
       sell = max(sell,buy+prices[i])
   }
  
    return sell
}

func max( a,b int)int{
    if a >b{
        return a
    }
    return b
}
```

## 5. LeetCode 123. 买卖股票的最佳时机 III

[123. 买卖股票的最佳时机 III](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-iii/)

### 5.1状态

有 第一次买入`firstBuy` 第一次卖出`firstSell`,第二次买入`secondBuy` 和 第二次卖出`secondSell` 这四种状态.

### 5.2转移方程

这里可以有两次的买入和卖出,也就是说 买入 状态之前可拥有 卖出 状态,所以买入和卖出的转移方程需要变化.

- `firstBuy = max(firstBuy , -price[i])`
- `firstSell = max(firstSell,firstBuy + prices[i] )`
- `secondBuy = max(secondBuy ,firstSell -price[i]) (受第一次卖出状态的影响)`
- `secondSell = max(secondSell ,secondBuy + prices[i] )`

### 5.3边界

一开始 `firstBuy = -prices[0]`

买入后直接卖出`firstSell = 0`

买入后再卖出再买入`secondBuy - prices[0]`

买入后再卖出再买入再卖出`secondSell = 0`

最后返回 `secondSell`

### 5.4 golang题解

```go
func maxProfit(prices []int) int {
    firstBuy,firstSell := int(math.MinInt32),0
    secondBuy,secondSell := int(math.MinInt32),0
    for _, price := range prices{
        firstBuy = max(firstBuy,-price)
        firstSell = max(firstSell,firstBuy+price)
        secondBuy = max(secondBuy,firstSell-price)
        secondSell = max(secondSell,secondBuy+price)
    }
    return secondSell

}
func max( a,b int)int{
    if a > b{
        return a
    }
    return b
}
```



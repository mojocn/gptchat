"use client"

import React, {useEffect} from 'react';
import {useConfigStore} from "@/store/config";
import {ALL_LANG, useLocal} from "@/store/local";
import {ALL_MODELS, ModelType} from "@/types/const";
import {Button} from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {IconSettings2} from "@tabler/icons-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import * as z from "zod"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "@/components/ui/use-toast";


const formSchema = z.object({
    model: z.string().nonempty(),
    top_p: z.coerce.number().min(0).max(1).positive(),
    temperature: z.coerce.number().min(0).max(1).positive(),
    frequency_penalty: z.coerce.number().min(0).max(1).positive(),
    presence_penalty: z.coerce.number().min(0).max(1).positive(),
    max_tokens: z.coerce.number().min(400).max(160000).positive(),
    max_history: z.coerce.number().min(4).max(16).positive(),


    lang: z.string().nonempty(),
})


export function DialogConfig() {
    const config = useConfigStore();
    const {lang, setLang} = useLocal();


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...config.modelConfig,
        },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        debugger
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)

        toast({
            title: "You submitted the following values:",
            description: (
                <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
            ),
        })
    }


    useEffect(() => {

    }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button title='Settings' variant="ghost"><IconSettings2/></Button>
            </DialogTrigger>
            <DialogContent className="md:max-w-[825px]">
                <DialogHeader>
                    <DialogTitle>Set global configuration</DialogTitle>
                    <DialogDescription>
                        Set global configuration
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="max_history"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>max_history</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="max_tokens" {...field} min={4} max={16}
                                               step={2}/>
                                    </FormControl>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="max_tokens"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>max_tokens</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="max_tokens" {...field} min={400} max={40000}
                                               step={200}/>
                                    </FormControl>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="top_p"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>top_p</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="top_p" {...field} min={0} max={1} step={0.1}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="temperature"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>temperature</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="temperature" {...field} min={0} max={1}
                                               step={0.1}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="model"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>model</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a verified model to display"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ALL_MODELS.map(m => <SelectItem key={m.value} value={m.value}
                                                                             disabled={m.disabled}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lang"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>lang</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a verified lang to display"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ALL_LANG.map(m => <SelectItem key={m.value} value={m.value}
                                                                           disabled={m.disabled}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Submit</Button>
                        </DialogFooter>
                    </form>
                </Form>


            </DialogContent>
        </Dialog>

    );
}


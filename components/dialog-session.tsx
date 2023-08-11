import {useEffect, useState} from 'react';
import {ChatState, Session, useChatStore} from "@/store/chat";
import {ALL_MODELS} from "@/types/const";
import {useLocal} from "@/store/local";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "@/components/ui/use-toast";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ModelConfig} from "@/store/config";
import {IconAdjustments} from "@tabler/icons-react";
import {useForm} from "react-hook-form";


const formSchemaSessionModel = z.object({
    model: z.string(),
    top_p: z.coerce.number(),
    temperature: z.coerce.number(),
    frequency_penalty: z.number(),
    presence_penalty: z.coerce.number(),
    max_tokens: z.coerce.number(),
    max_history: z.coerce.number(),


})

export function DialogSession({session}:{session:Session}) {
    const {
        upsertSession,
        getSelectedSession
    }: ChatState = useChatStore();
    const [open, setOpen] = useState(false);
    const {t} = useLocal()
    // const session = getSelectedSession() || {modelConfig: {}} as Session

    const formData = useForm<z.infer<typeof formSchemaSessionModel>>({
        resolver: zodResolver(formSchemaSessionModel),
        defaultValues: {...session.modelConfig},
    })


    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchemaSessionModel>) {
        setOpen(false)
        upsertSession({...session, modelConfig: values})
    }

    function onErrors(errors: any) {
        console.log(errors)
        debugger
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {/* eslint-disable-next-line react/jsx-no-undef */}
                <Button title='Settings' variant="ghost"><IconAdjustments/></Button>
            </DialogTrigger>
            <DialogContent className="md:max-w-[825px]">
                <DialogHeader>
                    <DialogTitle>Set Session configuration</DialogTitle>
                    <DialogDescription>
                        Set Session configuration
                    </DialogDescription>
                </DialogHeader>

                <Form {...formData}>
                    <form onSubmit={formData.handleSubmit(onSubmit, onErrors)} className="space-y-6">

                        <FormField
                            control={formData.control}
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
                            control={formData.control}
                            name="max_history"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>max_history</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="max_history" {...field} min={4} max={16}
                                               step={2}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={formData.control}
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
                            control={formData.control}
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
                            control={formData.control}
                            name="frequency_penalty"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>frequency_penalty</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="frequency_penalty" {...field} min={0} max={1}
                                               step={0.1}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={formData.control}
                            name="presence_penalty"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>presence_penalty</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="presence_penalty" {...field} min={0} max={1}
                                               step={0.1}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={formData.control}
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


                        <DialogFooter>
                            <Button type="submit">Submit</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}



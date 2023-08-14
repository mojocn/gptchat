import React from "react";
import { usePromptStore } from "@/store/prompt";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconList } from "@tabler/icons-react";

export function PopoverPromptList() {
  const { prompts } = usePromptStore();

  debugger;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          <IconList />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Accordion type="single" collapsible className="w-full">
          {prompts.map((prompt, i) => (
            <AccordionItem
              value="item-3"
              key={prompt.id + i.toString()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseEnter={() => {}}
            >
              <AccordionTrigger>{prompt.name}</AccordionTrigger>
              <AccordionContent>{prompt.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </PopoverContent>
    </Popover>
  );
}

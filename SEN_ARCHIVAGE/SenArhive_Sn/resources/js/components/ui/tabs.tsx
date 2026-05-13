import * as React from "react"

import { cn } from "@/lib/utils"

type TabsValue = string

interface TabsContextValue {
    value: string
    onChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

interface TabsProps extends React.ComponentPropsWithoutRef<"div"> {
    value?: TabsValue
    onValueChange?: (value: TabsValue) => void
    defaultValue?: TabsValue
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
    ({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
        const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
        const currentValue = value !== undefined ? value : internalValue

        const handleChange = React.useCallback(
            (newValue: string) => {
                if (value === undefined) {
                    setInternalValue(newValue)
                }
                onValueChange?.(newValue)
            },
            [value, onValueChange]
        )

        const contextValue = React.useMemo(
            () => ({ value: currentValue, onChange: handleChange }),
            [currentValue, handleChange]
        )

        return (
            <TabsContext.Provider value={contextValue}>
                <div ref={ref} className={cn("", className)} {...props}>
                    {children}
                </div>
            </TabsContext.Provider>
        )
    }
)
Tabs.displayName = "Tabs"

interface TabsListProps extends React.ComponentPropsWithoutRef<"div"> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
                className
            )}
            role="tablist"
            {...props}
        />
    )
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
    value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ className, value, onClick, ...props }, ref) => {
        const context = React.useContext(TabsContext)
        const isActive = context?.value === value

        return (
            <button
                ref={ref}
                role="tab"
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    isActive ? "bg-background text-foreground shadow" : "text-muted-foreground",
                    className
                )}
                type="button"
                onClick={(e) => {
                    context?.onChange(value)
                    onClick?.(e)
                }}
                {...props}
            />
        )
    }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.ComponentPropsWithoutRef<"div"> {
    value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
    ({ className, value, ...props }, ref) => {
        const context = React.useContext(TabsContext)
        const isActive = context?.value === value

        if (!isActive) return null

        return (
            <div
                ref={ref}
                className={cn(
                    "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    className
                )}
                role="tabpanel"
                {...props}
            />
        )
    }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
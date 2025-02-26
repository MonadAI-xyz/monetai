'use client';

import { Bold } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { AccordionDemo } from '@/components/demo/accordion-demo';
import { AlertDemo } from '@/components/demo/alert-demo';
import { AlertDialogDemo } from '@/components/demo/alert-dialog-demo';
import { AspectRatioDemo } from '@/components/demo/aspect-ratio-demo';
import { AvatarDemo } from '@/components/demo/avatar-demo';
import { BadgeDemo } from '@/components/demo/badge-demo';
import { BreadcrumbDemo } from '@/components/demo/breadcrumb-demo';
import { ButtonDemo } from '@/components/demo/button-demo';
import { CalendarDemo } from '@/components/demo/calendar-demo';
import { CardDemo } from '@/components/demo/card-demo';
import { CarouselDemo } from '@/components/demo/carousel-demo';
import { ChartSection } from '@/components/demo/chart-section';
import { CheckboxDemo } from '@/components/demo/checkbox-demo';
import { CollapsibleDemo } from '@/components/demo/collapsible-demo';
import { ComboboxDemo } from '@/components/demo/combobox-demo';
import { CommandDialogDemo } from '@/components/demo/command-demo';
import { ContextMenuDemo } from '@/components/demo/context-menu-demo';
import { DatePickerForm } from '@/components/demo/date-picker-form';
import { DialogDemo } from '@/components/demo/dialog-demo';
import { DrawerDemo } from '@/components/demo/drawer-demo';
import { DropdownMenuDemo } from '@/components/demo/dropdown-menu-demo';
import { FormInput } from '@/components/demo/form-input';
import { HoverCardDemo } from '@/components/demo/hover-card-demo';
import { InputOTPDemo } from '@/components/demo/input-otp-demo';
import { MenubarDemo } from '@/components/demo/menubar-demo';
import { NavigationMenuDemo } from '@/components/demo/navigation-menu-demo';
import { PaginationDemo } from '@/components/demo/pagination-demo';
import { ProgressDemo } from '@/components/demo/progress-demo';
import { RadioGroupDemo } from '@/components/demo/radio-group-demo';
import { ResizableDemo } from '@/components/demo/resizable-demo';
import { ScrollAreaDemo } from '@/components/demo/scroll-area-demo';
import { SeparatorDemo } from '@/components/demo/separator-demo';
import { SheetDemo } from '@/components/demo/sheet-demo';
import { SkeletonDemo } from '@/components/demo/skeleton-demo';
import { SliderDemo } from '@/components/demo/slider-demo';
import { SwitchDemo } from '@/components/demo/switch-demo';
import { TableDemo } from '@/components/demo/table-demo';
import { TabsDemo } from '@/components/demo/tabs-demo';
import { ToggleGroupDemo } from '@/components/demo/toggle-group-demo';
import { ModeToggle } from '@/components/demo/toggle-mode';
import { TooltipDemo } from '@/components/demo/tooltip-demo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';

const ComponentsPage = () => {
  return (
    <div className="bg-background">
      <div className="bg-background sticky top-0 z-10 flex w-full items-start justify-between border-b border-gray-500/20 px-4 py-4 shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">Components</h2>
          <p className="text-sm text-gray-500">
            This is a list of components that are available to use in your app.
          </p>
        </div>
        <ModeToggle />
      </div>

      <div className="container mx-auto flex flex-col items-start space-y-20 px-4 py-16 md:px-0">
        {/* Accordion */}
        <div className="flex w-full max-w-md flex-col space-y-4">
          <h4 className="text-lg font-medium">Accordion</h4>
          <AccordionDemo />
        </div>

        {/* Alert */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Alert</h4>
          <AlertDemo />
        </div>

        {/* Alert Dialog */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Alert Dialog</h4>
          <AlertDialogDemo />
        </div>

        {/* Aspect Ratio */}
        <div className="flex w-full max-w-4xl flex-col space-y-4">
          <h4 className="text-lg font-medium">Aspect Ratio</h4>
          <AspectRatioDemo />
        </div>

        {/* Avatar */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Avatar</h4>
          <AvatarDemo />
        </div>

        {/* Badge */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Badge</h4>
          <BadgeDemo />
        </div>

        {/* Breadcrumb */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Breadcrumb</h4>
          <BreadcrumbDemo />
        </div>

        {/* Button */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Button</h4>
          <ButtonDemo />
        </div>

        {/* Calendar */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Calendar</h4>
          <CalendarDemo />
        </div>

        {/* Card */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Card</h4>
          <CardDemo />
        </div>

        {/* Carousel */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Carousel</h4>
          <CarouselDemo />
        </div>

        {/* Chart */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Chart</h4>
          <ChartSection />
        </div>

        {/* Checkbox */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Checkbox</h4>
          <CheckboxDemo />
        </div>

        {/* Collapsible */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Collapsible</h4>
          <CollapsibleDemo />
        </div>

        {/* Combobox */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Combobox</h4>
          <ComboboxDemo />
        </div>

        {/* Command */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Command</h4>
          <CommandDialogDemo />
        </div>

        {/* Context Menu */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Context Menu</h4>
          <ContextMenuDemo />
        </div>

        {/* Data Table */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Data Table</h4>
          <Link href="/components/payments">
            <Button>See demo</Button>
          </Link>
        </div>

        {/* Date Picker */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Date Picker</h4>
          <DatePickerForm />
        </div>

        {/* Dialog */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Dialog</h4>
          <DialogDemo />
        </div>

        {/* Drawer */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Drawer</h4>
          <DrawerDemo />
        </div>

        {/* Dropdown Menu */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Dropdown Menu</h4>
          <DropdownMenuDemo />
        </div>

        {/* Form */}
        <div className="flex w-full max-w-sm flex-col space-y-4">
          <h4 className="text-lg font-medium">Form</h4>
          <FormInput />
        </div>

        {/* Hover Card */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Hover Card</h4>
          <HoverCardDemo />
        </div>

        {/* Input */}
        <div className="flex w-full max-w-sm flex-col space-y-4">
          <h4 className="text-lg font-medium">Input</h4>
          <Input placeholder="Email" type="email" />

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="input-with-label">Input with label</Label>
            <Input
              id="input-with-label"
              placeholder="Input with label"
              type="input-with-label"
            />
          </div>
        </div>

        {/* Input OTP */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Input OTP</h4>
          <InputOTPDemo />
        </div>

        {/* Label */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Label</h4>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms-condition" />
            <Label htmlFor="terms-condition">Accept terms and conditions</Label>
          </div>
        </div>

        {/* Menubar */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Menubar</h4>
          <MenubarDemo />
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Navigation Menu</h4>
          <NavigationMenuDemo />
        </div>

        {/* Pagination */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Pagination</h4>
          <PaginationDemo />
        </div>

        {/* Popover */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Popover</h4>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">Dimensions</h4>
                  <p className="text-muted-foreground text-sm">
                    Set the dimensions for the layer.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      className="col-span-2 h-8"
                      defaultValue="100%"
                      id="width"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="maxWidth">Max. width</Label>
                    <Input
                      className="col-span-2 h-8"
                      defaultValue="300px"
                      id="maxWidth"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      className="col-span-2 h-8"
                      defaultValue="25px"
                      id="height"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="maxHeight">Max. height</Label>
                    <Input
                      className="col-span-2 h-8"
                      defaultValue="none"
                      id="maxHeight"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Progress */}
        <div className="flex w-full max-w-lg flex-col space-y-4">
          <h4 className="text-lg font-medium">Progress</h4>
          <ProgressDemo />
        </div>

        {/* Radio Group */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Radio Group</h4>
          <RadioGroupDemo />
        </div>

        {/* Resizable */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Resizable</h4>
          <ResizableDemo />
        </div>

        {/* Scroll Area */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Scroll Area</h4>
          <ScrollAreaDemo />
        </div>

        {/* Select */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Select</h4>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Separator */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Separator</h4>
          <SeparatorDemo />
        </div>

        {/* Sheet */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Sheet</h4>
          <SheetDemo />
        </div>

        {/* Skeleton */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Skeleton</h4>
          <SkeletonDemo />
        </div>

        {/* Slider */}
        <div className="flex w-full max-w-lg flex-col space-y-4">
          <h4 className="text-lg font-medium">Slider</h4>
          <SliderDemo />
        </div>

        {/* Sonner */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Sonner</h4>
          <Button
            variant="outline"
            onClick={() =>
              toast('Event has been created', {
                description: 'Sunday, December 03, 2023 at 9:00 AM',
                action: {
                  label: 'Undo',
                  onClick: () => console.log('Undo'),
                },
              })
            }
          >
            Show Toast
          </Button>
        </div>

        {/* Switch */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Switch</h4>
          <SwitchDemo />
        </div>

        {/* Table */}
        <div className="flex w-full max-w-xl flex-col space-y-4">
          <h4 className="text-lg font-medium">Table</h4>
          <TableDemo />
        </div>

        {/* Tabs */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Tabs</h4>
          <TabsDemo />
        </div>

        {/* Textarea */}
        <div className="flex w-full max-w-sm flex-col space-y-4">
          <h4 className="text-lg font-medium">Textarea</h4>
          <Textarea placeholder="Type your message here." />
        </div>

        {/* Toggle */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Toggle</h4>
          <Toggle ria-label="Toggle italic">
            <Bold className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Toggle Group */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Toggle Group</h4>
          <ToggleGroupDemo />
        </div>

        {/* Tooltip */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-lg font-medium">Tooltip</h4>
          <TooltipDemo />
        </div>
      </div>
    </div>
  );
};

export default ComponentsPage;

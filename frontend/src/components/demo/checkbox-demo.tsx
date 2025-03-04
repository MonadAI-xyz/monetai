import { CheckboxForm } from '@/components/demo/checkbox-form';
import { Checkbox } from '@/components/ui/checkbox';

export const CheckboxDemo = () => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <label
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          htmlFor="terms"
        >
          Accept terms and conditions
        </label>
      </div>
      <div className="items-top flex space-x-2">
        <Checkbox id="terms1" />
        <div className="grid gap-1.5 leading-none">
          <label
            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            htmlFor="terms1"
          >
            Accept terms and conditions
          </label>
          <p className="text-muted-foreground text-sm">
            You agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
      <CheckboxForm />
    </>
  );
};

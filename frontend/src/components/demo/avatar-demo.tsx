import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const AvatarDemo = () => {
  return (
    <Avatar>
      <AvatarImage
        alt="@airfoil-frontend"
        src="https://github.com/airfoil-frontend.png"
      />
      <AvatarFallback>AF</AvatarFallback>
    </Avatar>
  );
};

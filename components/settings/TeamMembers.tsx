import { Card, CardContent } from '../ui/card'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'

export default function TeamMembers() {
  return (
    <div className='flex justify-center'>
        <Card className='flex flex-col p-4 md:w-[80%] w-full gap-4 border-none'>
            <div className='flex justify-between items-center'>
                <div>
                    <Label className='text-xl font-semibold'>Team Members</Label>
                    <span className='text-sm text-muted-foreground'>Manage your project team members</span>
                </div>
                <div>
                    <Button className='cursor-pointer transition-all duration-200 ease-in-out'>
                        <UserPlus />
                        Add Member
                    </Button>
                </div>
            </div>
            <Card className='border bg-transparent p-0 py-4'>
                <CardContent className='flex flex-col gap-2'>
                    <div className='flex items-center gap-3'>
                        <Avatar className='size-10'>
                            <AvatarImage src='https://github.com/shadcn.png' />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                            <div className='flex items-center gap-2'>
                                <Label className='text-md font-semibold'>John Doe</Label>
                                <Badge> Owner </Badge>
                            </div>
                            <span className='text-sm text-muted-foreground'>john.doe@example.com</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Card>
    </div>
  )
}

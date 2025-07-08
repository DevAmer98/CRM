import { auth } from '@/app/api/auth/[...nextauth]/route';
import AddLeave from '@/app/ui/forms/leaves/AddLeave'
import AddShift from '@/app/ui/forms/shifts/AddShift';
import React from 'react'

const AddShiftPage = async() => {
  const session = await auth();


  return (
    
    <AddShift session={session}/>

  )
}
 
export default AddShiftPage 
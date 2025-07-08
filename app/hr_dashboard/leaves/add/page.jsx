import { auth } from '@/app/api/auth/[...nextauth]/route';
import AddLeave from '@/app/ui/forms/leaves/AddLeave'
import React from 'react'

const AddLeavesPage = async() => {
  const session = await auth();


  return (
    
    <AddLeave session={session}/>

  )
}
 
export default AddLeavesPage 
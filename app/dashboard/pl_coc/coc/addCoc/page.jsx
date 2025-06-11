"use client";
import React, {useState, useEffect} from 'react'; 
import { FaPlus, FaTrash } from 'react-icons/fa';
import styles from '@/app/ui/dashboard/approve/approve.module.css';
import { addCoc } from '@/app/lib/actions';
import AddCoc from '@/app/ui/forms/Coc';

const AddCocPage = () => {
  
  return (
  
  <AddCoc />
  )
  
};

export default AddCocPage;

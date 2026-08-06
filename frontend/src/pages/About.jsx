import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-centre text-2xl pt-10 text-gray-500'>
        <p>ABOUT <span className='text-gary-700 font-medium'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt=''/>
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>Welcome to Prescripto, your trusted partner in managing your helthcare needs convinently and efficiently. At Prescripto, we understand the Challenges individulas face when it comes to scheduling doctors Appointments and managing their Health Records.</p>
          <p> Prescripto is Committed to Excellence in heallth care Technology. We continuously Strive to enhance our Platform. Integarting the latest Advancements to improve user Experience and deliver superior services. Whether you're booking Your First Appointment or Managing ongoing care.Prescripto  is here to support you Every Step Of the Way.</p>
          <p className='text-gray-800'>Our Vision</p>
          <p>Our Vision At Prescripto is to Create A Seamless Healthcare experience For Every User. We aim to Bridge the Gap Between Patients  And HEalthcare Providers, Making it easier For You To Access the care you need, When You Need it.</p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>WHY <span className='text-gray-700 font-semibold'> CHOOSE US</span></p>
      </div>

      <div className='flex flex-col md:flex-row mb-20 gap-8'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>Efficiency:</b>
          <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>Convenience:</b>
          <p>Access to a network of trusted healthcare professionals in your area.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>Personalization:</b>
          <p>Tailored recommendations and remainders to help you stay on top of your health.</p>
        </div>
      </div>
    </div>
  )
}

export default About

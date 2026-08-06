import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const DoctorProfile = () => {

  const { dToken, profileData, getProfileData, backendUrl } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  const [fees, setFees] = useState('')
  const [about, setAbout] = useState('')
  const [available, setAvailable] = useState(true)
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  useEffect(() => {
    if (dToken) {
      getProfileData()
    }
  }, [dToken])

  useEffect(() => {
    if (profileData) {
      setFees(profileData.fees)
      setAbout(profileData.about)
      setAvailable(profileData.available)
      setAddress1(profileData.address?.line1 || '')
      setAddress2(profileData.address?.line2 || '')
    }
  }, [profileData])

  const updateProfile = async () => {
    setSaving(true)
    try {
      const payload = {
        fees: Number(fees),
        about,
        available,
        address: JSON.stringify({ line1: address1, line2: address2 })
      }

      const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', payload, { headers: { dtoken: dToken } })

      if (data.success) {
        toast.success(data.message)
        setIsEdit(false)
        getProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!profileData) {
    return <p className='m-5'>Loading...</p>
  }

  return (
    <div className='m-5'>
      <div className='flex flex-col gap-4'>
        <div>
          <img className='bg-primary/80 w-full sm:max-w-64 rounded-lg' src={profileData.image} alt='' />
        </div>

        <div className='flex-1 border border-stone-200 rounded-lg p-8 bg-white max-w-2xl'>
          <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{profileData.name}</p>
          <div className='flex items-center gap-2 mt-1 text-gray-600'>
            <p>{profileData.degree} - {profileData.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{profileData.experience}</button>
          </div>

          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>About:</p>
            {isEdit
              ? <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full border rounded px-3 py-2 text-sm text-gray-600 mt-1' rows={6} />
              : <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{about}</p>
            }
          </div>

          <p className='text-gray-600 font-medium mt-4'>
            Appointment fee: <span className='text-gray-800'>
              {currency} {isEdit ? <input type='number' min='0' onChange={(e) => setFees(e.target.value)} value={fees} className='border rounded px-2 py-1 w-24 ml-1' /> : fees}
            </span>
          </p>

          <div className='flex gap-2 py-2'>
            <p>Address:</p>
            <div className='text-sm'>
              {isEdit
                ? <>
                  <input onChange={(e) => setAddress1(e.target.value)} value={address1} className='border rounded px-2 py-1 mb-1 w-full' type='text' />
                  <input onChange={(e) => setAddress2(e.target.value)} value={address2} className='border rounded px-2 py-1 w-full' type='text' />
                </>
                : <p className='text-gray-500'>{address1}<br />{address2}</p>
              }
            </div>
          </div>

          <div className='flex items-center gap-1 mt-4'>
            <input onChange={() => isEdit && setAvailable(prev => !prev)} checked={available} type='checkbox' readOnly={!isEdit} />
            <label>Available</label>
          </div>

          {
            isEdit
              ? <button disabled={saving} onClick={updateProfile} className='px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all disabled:opacity-60'>{saving ? 'Saving...' : 'Save'}</button>
              : <button onClick={() => setIsEdit(true)} className='px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all'>Edit</button>
          }
        </div>
      </div>
    </div>
  )
}

export default DoctorProfile

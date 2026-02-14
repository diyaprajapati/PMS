import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function logo() {
  return (
    <div className='bg-secondary py-2 ps-20'>
        <Link href="/projects">
            <Image src="/logo.png" alt="logo" width={80} height={80} />
        </Link>
    </div>
  )
}

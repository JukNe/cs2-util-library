import Sidebar from '@/components/sidebar';
import Image from 'next/image'

const Dust2 = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
            <Sidebar />
            <div className={'map-overview'} style={{ display: 'flex', justifyContent: 'center' }}>
                <Image unoptimized priority width={0} height={0} src={'/dust2.webp'} alt={'Dust 2'}
                    style={{
                        height: '85vh', width: 'auto'
                    }} />
            </div>
        </div>
    )
}

export default Dust2;

declare module 'react-leaflet-cluster' {
    import { FC, ReactNode } from 'react';
    import { LayerGroupProps } from 'react-leaflet';
    import { MarkerClusterGroupOptions } from 'leaflet';

    interface MarkerClusterGroupProps extends LayerGroupProps, MarkerClusterGroupOptions {
        children: ReactNode;
        chunkedLoading?: boolean;
    }

    const MarkerClusterGroup: FC<MarkerClusterGroupProps>;
    export default MarkerClusterGroup;
}

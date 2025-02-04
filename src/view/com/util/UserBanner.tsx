import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {useTheme as useAlfTheme} from '#/alf'
import {openCamera, openCropper, openPicker} from '../../../lib/media/picker'
import {
  usePhotoLibraryPermission,
  useCameraPermission,
} from 'lib/hooks/usePermissions'
import {usePalette} from 'lib/hooks/usePalette'
import {isAndroid, isNative} from 'platform/detection'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {EventStopper} from 'view/com/util/EventStopper'
import * as Menu from '#/components/Menu'
import {
  Camera_Filled_Stroke2_Corner0_Rounded as CameraFilled,
  Camera_Stroke2_Corner0_Rounded as Camera,
} from '#/components/icons/Camera'
import {StreamingLive_Stroke2_Corner0_Rounded as Library} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'

export function UserBanner({
  banner,
  moderation,
  onSelectNewBanner,
}: {
  banner?: string | null
  moderation?: ModerationUI
  onSelectNewBanner?: (img: RNImage | null) => void
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const t = useAlfTheme()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const onOpenCamera = React.useCallback(async () => {
    if (!(await requestCameraAccessIfNeeded())) {
      return
    }
    onSelectNewBanner?.(
      await openCamera({
        width: 3000,
        height: 1000,
      }),
    )
  }, [onSelectNewBanner, requestCameraAccessIfNeeded])

  const onOpenLibrary = React.useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await openPicker()
    if (!items[0]) {
      return
    }

    onSelectNewBanner?.(
      await openCropper({
        mediaType: 'photo',
        path: items[0].path,
        width: 3000,
        height: 1000,
      }),
    )
  }, [onSelectNewBanner, requestPhotoAccessIfNeeded])

  const onRemoveBanner = React.useCallback(() => {
    onSelectNewBanner?.(null)
  }, [onSelectNewBanner])

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Edit avatar`)}>
          {({props}) => (
            <TouchableOpacity {...props} activeOpacity={0.8}>
              {banner ? (
                <Image
                  testID="userBannerImage"
                  style={styles.bannerImage}
                  source={{uri: banner}}
                  accessible={true}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View
                  testID="userBannerFallback"
                  style={[styles.bannerImage, styles.defaultBanner]}
                />
              )}
              <View style={[styles.editButtonContainer, pal.btn]}>
                <CameraFilled height={14} width={14} style={t.atoms.text} />
              </View>
            </TouchableOpacity>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel>
          <Menu.Group>
            {isNative && (
              <Menu.Item
                testID="changeBannerCameraBtn"
                label={_(msg`Upload from Camera`)}
                onPress={onOpenCamera}>
                <Menu.ItemText>
                  <Trans>Upload from Camera</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={Camera} />
              </Menu.Item>
            )}

            <Menu.Item
              testID="changeBannerLibraryBtn"
              label={_(msg`Upload from Library`)}
              onPress={onOpenLibrary}>
              <Menu.ItemText>
                {isNative ? (
                  <Trans>Upload from Library</Trans>
                ) : (
                  <Trans>Upload from Files</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon icon={Library} />
            </Menu.Item>
          </Menu.Group>
          {!!banner && (
            <>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item
                  testID="changeBannerRemoveBtn"
                  label={_(`Remove Banner`)}
                  onPress={onRemoveBanner}>
                  <Menu.ItemText>
                    <Trans>Remove Banner</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={Trash} />
                </Menu.Item>
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : banner &&
    !((moderation?.blur && isAndroid) /* android crashes with blur */) ? (
    <Image
      testID="userBannerImage"
      style={[
        styles.bannerImage,
        {backgroundColor: theme.palette.default.backgroundLight},
      ]}
      resizeMode="cover"
      source={{uri: banner}}
      blurRadius={moderation?.blur ? 100 : 0}
      accessible={true}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      testID="userBannerFallback"
      style={[styles.bannerImage, styles.defaultBanner]}
    />
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 8,
    right: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5,
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
  defaultBanner: {
    backgroundColor: '#0070ff',
  },
})

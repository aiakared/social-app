/* eslint-disable react/prop-types */

import React from 'react'
import {View, Pressable, ViewStyle, StyleProp} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {atoms as a, useTheme, flatten, web} from '#/alf'
import {Text} from '#/components/Typography'

import {
  ContextType,
  TriggerProps,
  ItemProps,
  GroupProps,
  ItemTextProps,
  ItemIconProps,
  RadixPassThroughTriggerProps,
} from '#/components/Menu/types'
import {Context} from '#/components/Menu/context'
import {Portal} from '#/components/Portal'

export function useMenuControl(): Dialog.DialogControlProps {
  const id = React.useId()
  const [isOpen, setIsOpen] = React.useState(false)

  return React.useMemo(
    () => ({
      id,
      ref: {current: null},
      isOpen,
      open() {
        setIsOpen(true)
      },
      close() {
        setIsOpen(false)
      },
    }),
    [id, isOpen, setIsOpen],
  )
}

export function useMemoControlContext() {
  return React.useContext(Context)
}

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogOuterProps['control']
}>) {
  const {_} = useLingui()
  const defaultControl = useMenuControl()
  const context = React.useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
    }),
    [control, defaultControl],
  )
  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (context.control.isOpen && !open) {
        context.control.close()
      } else if (!context.control.isOpen && open) {
        context.control.open()
      }
    },
    [context.control],
  )

  return (
    <Context.Provider value={context}>
      {context.control.isOpen && (
        <Portal>
          <Pressable
            style={[a.fixed, a.inset_0, a.z_50]}
            onPress={() => context.control.close()}
            accessibilityHint=""
            accessibilityLabel={_(
              msg`Context menu backdrop, click to close the menu.`,
            )}
          />
        </Portal>
      )}
      <DropdownMenu.Root
        open={context.control.isOpen}
        onOpenChange={onOpenChange}>
        {children}
      </DropdownMenu.Root>
    </Context.Provider>
  )
}

const RadixTriggerPassThrough = React.forwardRef(
  (
    props: {
      children: (
        props: RadixPassThroughTriggerProps & {
          ref: React.Ref<any>
        },
      ) => React.ReactNode
    },
    ref,
  ) => {
    // @ts-expect-error Radix provides no types of this stuff
    return props.children({...props, ref})
  },
)
RadixTriggerPassThrough.displayName = 'RadixTriggerPassThrough'

export function Trigger({children, label}: TriggerProps) {
  const {control} = React.useContext(Context)
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Trigger asChild>
      <RadixTriggerPassThrough>
        {props =>
          children({
            isNative: false,
            control,
            state: {
              hovered,
              focused,
              pressed: false,
            },
            props: {
              ...props,
              // disable on web, use `onPress`
              onPointerDown: () => false,
              onPress: () =>
                control.isOpen ? control.close() : control.open(),
              onFocus: onFocus,
              onBlur: onBlur,
              onMouseEnter,
              onMouseLeave,
              accessibilityLabel: label,
            },
          })
        }
      </RadixTriggerPassThrough>
    </DropdownMenu.Trigger>
  )
}

export function Outer({
  children,
  style,
}: React.PropsWithChildren<{
  showCancel?: boolean
  style?: StyleProp<ViewStyle>
}>) {
  const t = useTheme()

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content sideOffset={5} loop aria-label="Test">
        <View
          style={[
            a.rounded_sm,
            a.p_xs,
            t.name === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25,
            t.atoms.shadow_md,
            style,
          ]}>
          {children}
        </View>

        {/* Disabled until we can fix positioning
        <DropdownMenu.Arrow
          className="DropdownMenuArrow"
          fill={
            (t.name === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25)
              .backgroundColor
          }
        />
          */}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

export function Item({children, label, onPress, ...rest}: ItemProps) {
  const t = useTheme()
  const {control} = React.useContext(Context)
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Item asChild>
      <Pressable
        {...rest}
        className="radix-dropdown-item"
        accessibilityHint=""
        accessibilityLabel={label}
        onPress={e => {
          onPress(e)

          /**
           * Ported forward from Radix
           * @see https://www.radix-ui.com/primitives/docs/components/dropdown-menu#item
           */
          if (!e.defaultPrevented) {
            control.close()
          }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        // need `flatten` here for Radix compat
        style={flatten([
          a.flex_row,
          a.align_center,
          a.gap_sm,
          a.py_sm,
          a.rounded_xs,
          {minHeight: 32, paddingHorizontal: 10},
          web({outline: 0}),
          (hovered || focused) && [
            web({outline: '0 !important'}),
            t.name === 'light'
              ? t.atoms.bg_contrast_25
              : t.atoms.bg_contrast_50,
          ],
        ])}
        {...web({
          onMouseEnter,
          onMouseLeave,
        })}>
        {children}
      </Pressable>
    </DropdownMenu.Item>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  return (
    <Text style={[a.flex_1, a.font_bold, t.atoms.text_contrast_high, style]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp, position = 'left'}: ItemIconProps) {
  const t = useTheme()
  return (
    <Comp
      size="md"
      fill={t.atoms.text_contrast_medium.color}
      style={[
        position === 'left' && {
          marginLeft: -2,
        },
        position === 'right' && {
          marginRight: -2,
          marginLeft: 12,
        },
      ]}
    />
  )
}

export function Group({children}: GroupProps) {
  return children
}

export function Divider() {
  const t = useTheme()
  return (
    <DropdownMenu.Separator
      style={flatten([
        a.my_xs,
        t.atoms.bg_contrast_100,
        {
          height: 1,
        },
      ])}
    />
  )
}

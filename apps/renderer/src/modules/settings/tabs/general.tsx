import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { IN_ELECTRON } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { currentSupportedLanguages } from "~/@types/constants"
import { defaultResources } from "~/@types/default-resource"
import { langLoadingLockMapAtom } from "~/atoms/lang"
import {
  setGeneralSetting,
  useGeneralSettingKey,
  useGeneralSettingSelector,
  useGeneralSettingValue,
} from "~/atoms/settings/general"
import { useProxyValue, useSetProxy } from "~/hooks/biz/useProxySetting"
import { fallbackLanguage } from "~/i18n"
import { tipcClient } from "~/lib/client"

import { SettingDescription, SettingInput } from "../control"
import { createSetting } from "../helper/builder"
import { SettingItemGroup } from "../section"

const { defineSettingItem, SettingBuilder } = createSetting(
  useGeneralSettingValue,
  setGeneralSetting,
)
export const SettingGeneral = () => {
  const { t } = useTranslation("settings")
  useEffect(() => {
    tipcClient?.getLoginItemSettings().then((settings) => {
      setGeneralSetting("appLaunchOnStartup", settings.openAtLogin)
    })
  }, [])

  const saveLoginSetting = useCallback((checked: boolean) => {
    tipcClient?.setLoginItemSettings(checked)

    setGeneralSetting("appLaunchOnStartup", checked)
  }, [])

  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("general.app"),
          },

          defineSettingItem("appLaunchOnStartup", {
            label: t("general.launch_at_login"),
            disabled: !tipcClient,
            onChange(value) {
              saveLoginSetting(value)
            },
          }),
          LanguageSelector,
          {
            type: "title",
            value: t("general.timeline"),
          },
          defineSettingItem("unreadOnly", {
            label: t("general.show_unread_on_launch.label"),
            description: t("general.show_unread_on_launch.description"),
          }),
          defineSettingItem("groupByDate", {
            label: t("general.group_by_date.label"),
            description: t("general.group_by_date.description"),
          }),

          { type: "title", value: t("general.unread") },

          defineSettingItem("scrollMarkUnread", {
            label: t("general.mark_as_read.scroll.label"),
            description: t("general.mark_as_read.scroll.description"),
          }),
          defineSettingItem("hoverMarkUnread", {
            label: t("general.mark_as_read.hover.label"),
            description: t("general.mark_as_read.hover.description"),
          }),
          defineSettingItem("renderMarkUnread", {
            label: t("general.mark_as_read.render.label"),
            description: t("general.mark_as_read.render.description"),
          }),

          { type: "title", value: "TTS", disabled: !IN_ELECTRON },

          IN_ELECTRON && VoiceSelector,

          { type: "title", value: t("general.network"), disabled: !IN_ELECTRON },
          IN_ELECTRON && NettingSetting,
        ]}
      />
    </div>
  )
}

const VoiceSelector = () => {
  const { t } = useTranslation("settings")

  const { data } = useQuery({
    queryFn: () => tipcClient?.getVoices(),
    queryKey: ["voices"],
    meta: {
      persist: true,
    },
  })

  const voice = useGeneralSettingKey("voice")

  return (
    <div className="-mt-1 mb-3 flex items-center justify-between">
      <span className="shrink-0 text-sm font-medium">{t("general.voices")}</span>
      <Select
        defaultValue={voice}
        value={voice}
        onValueChange={(value) => {
          setGeneralSetting("voice", value)
        }}
      >
        <SelectTrigger size="sm" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          {data?.map((item) => (
            <SelectItem key={item.ShortName} value={item.ShortName}>
              {item.FriendlyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export const LanguageSelector = ({
  containerClassName,
  contentClassName,
}: {
  containerClassName?: string
  contentClassName?: string
}) => {
  const { t } = useTranslation("settings")
  const { t: langT } = useTranslation("lang")
  const language = useGeneralSettingSelector((state) => state.language)

  const finalRenderLanguage = currentSupportedLanguages.includes(language)
    ? language
    : fallbackLanguage

  const [loadingLanguageLockMap] = useAtom(langLoadingLockMapAtom)

  return (
    <div className={cn("mb-3 mt-4 flex items-center justify-between", containerClassName)}>
      <span className="shrink-0 text-sm font-medium">{t("general.language")}</span>
      <Select
        defaultValue={finalRenderLanguage}
        value={finalRenderLanguage}
        disabled={loadingLanguageLockMap[finalRenderLanguage]}
        onValueChange={(value) => {
          setGeneralSetting("language", value as string)
        }}
      >
        <SelectTrigger
          size="sm"
          className={cn("w-48", loadingLanguageLockMap[finalRenderLanguage] && "opacity-50")}
        >
          <SelectValue />
          {loadingLanguageLockMap[finalRenderLanguage] && <LoadingCircle size="small" />}
        </SelectTrigger>
        <SelectContent position="item-aligned" className={contentClassName}>
          {currentSupportedLanguages.map((lang) => {
            const percent = I18N_COMPLETENESS_MAP[lang]

            const languageName =
              langT(`langs.${lang}` as any) === `langs.${lang}`
                ? defaultResources[lang].lang.name
                : langT(`langs.${lang}` as any)

            const originalLanguageName = defaultResources[lang].lang.name
            return (
              <SelectItem className="group" key={lang} value={lang}>
                <span
                  className={cn(originalLanguageName !== languageName && "group-hover:invisible")}
                >
                  {languageName}
                  {typeof percent === "number" ? (percent >= 100 ? null : ` (${percent}%)`) : null}
                </span>
                {originalLanguageName !== languageName && (
                  <span
                    className="absolute inset-0 hidden items-center pl-2 group-hover:flex"
                    key={"org"}
                  >
                    {originalLanguageName}
                  </span>
                )}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

const NettingSetting = () => {
  const { t } = useTranslation("settings")
  const proxyConfig = useProxyValue()
  const setProxyConfig = useSetProxy()

  return (
    <SettingItemGroup>
      <SettingInput
        type="text"
        label={t("general.proxy.label")}
        labelClassName="w-[150px]"
        value={proxyConfig}
        onChange={(event) => setProxyConfig(event.target.value.trim())}
      />
      <SettingDescription>{t("general.proxy.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

import { describe, test, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import TaskItem from '@/components/TaskItem.vue'
import TaskFilter from '@/components/TaskFilter.vue'
import TaskForm from '@/components/TaskForm.vue'
import StateMessage from '@/components/StateMessage.vue'
import type { Task } from '@/types'

const task: Task = Object.freeze({
  id: 'abc',
  title: 'Estudiar Vue',
  description: 'Unidad 3',
  status: 'pendiente',
  attachment: null,
  version: 0,
  createdAt: '2026-11-15T15:00:00.000Z',
  updatedAt: '2026-11-15T15:00:00.000Z',
})
const global = { stubs: { RouterLink: RouterLinkStub } }

describe('TaskItem', () => {
  test('avisa del cambio de estado con un evento y no modifica la prop', async () => {
    const wrapper = mount(TaskItem, { props: { task }, global })
    const select = wrapper.find('select')
    await select.setValue('completada')
    expect(wrapper.emitted('change-status')).toEqual([['completada']])
    expect(task.status).toBe('pendiente') // el objeto está congelado: mutarlo habría lanzado un error
    expect(select.element.value).toBe('pendiente') // espera la confirmación de la API
  })

  test('emite "delete" y bloquea los controles mientras hay una petición en curso', async () => {
    const wrapper = mount(TaskItem, { props: { task }, global })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
    await wrapper.setProps({ pending: true })
    expect(wrapper.find('select').element.disabled).toBe(true)
    expect(wrapper.find('button').element.disabled).toBe(true)
  })

  test('en solo lectura no muestra controles de cambio', () => {
    const wrapper = mount(TaskItem, { props: { task, readOnly: true }, global })
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })
})

describe('TaskFilter', () => {
  test('marca la opción activa y emite update:modelValue', async () => {
    const wrapper = mount(TaskFilter, {
      props: { modelValue: 'todas', counts: { todas: 3, pendiente: 2 } },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0]!.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]!.text()).toContain('2')
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['pendiente']])
  })
})

describe('TaskForm', () => {
  test('no emite submit si el título es muy corto y enlaza el mensaje de error', async () => {
    const wrapper = mount(TaskForm, { attachTo: document.body })
    await wrapper.find('input').setValue('ab')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    const input = wrapper.find('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(
      document.getElementById(input.attributes('aria-describedby') ?? '')?.textContent,
    ).toContain('entre 3 y 100')
    wrapper.unmount()
  })

  test('emite los datos limpios cuando son válidos', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('input').setValue('  Estudiar Vue  ')
    await wrapper.find('textarea').setValue('Unidad 3')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([
      [{ title: 'Estudiar Vue', description: 'Unidad 3' }],
    ])
  })

  test('muestra los errores por campo que devuelve la API', () => {
    const wrapper = mount(TaskForm, {
      props: { serverErrors: { title: 'Ya tienes una tarea con ese título.' } },
    })
    expect(wrapper.text()).toContain('Ya tienes una tarea con ese título.')
  })
})

describe('StateMessage', () => {
  test('el error usa role="alert" y el botón emite "action"', async () => {
    const wrapper = mount(StateMessage, {
      props: { type: 'error', title: 'Falló', actionLabel: 'Reintentar' },
    })
    expect(wrapper.attributes('role')).toBe('alert')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })
})
